import { createApp } from './app.js';
import { config } from './config.js';
import './db/index.js'; // creates the tables on first run

const app = createApp();

app.listen(config.port, () => {
  console.log(`UFH Residence Maintenance Portal API`);
  console.log(`Listening on http://localhost:${config.port}`);
  console.log(`Allowed frontend origin: ${config.corsOrigin}`);
});
