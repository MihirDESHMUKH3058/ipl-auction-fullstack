import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sync-auction-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && req.url.endsWith('/api/sync-auction')) {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { records, players } = JSON.parse(body);
                console.log(`[Sync] Received ${Object.keys(records).length} auction records for sync.`);

                const data = Object.entries(records).map(([id, record]) => {
                  const p = players.find(p => p.id.toString() === id);
                  return {
                    "Player Name": p?.name || 'Unknown',
                    "Team": record.team,
                    "Sold Price": record.final_price,
                    "Rating": p?.rating || 0
                  };
                });

                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, "Auction Results");

                // Write to the root project folder
                const filePath = path.resolve(server.config.root, '..', 'auction_results.xlsx');
                XLSX.writeFile(wb, filePath);
                console.log(`[Sync] Successfully updated Excel file at: ${filePath}`);

                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, path: filePath }));
              } catch (err) {
                if (err.code === 'EBUSY') {
                  console.error(`[Sync Error] Cannot update Excel file because it is OPEN in another program. Please CLOSE 'auction_results.xlsx' and try again.`);
                  res.statusCode = 409; // Conflict
                  res.end(JSON.stringify({ error: "FILE_LOCKED", message: "Excel file is open in another program. Please close it and try again." }));
                } else {
                  console.error(`[Sync Error] ${err.message}`);
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  base: (process.env.NODE_ENV === 'production' && !process.env.VERCEL) ? '/ipl-auction-dashboard/' : '/',
})
