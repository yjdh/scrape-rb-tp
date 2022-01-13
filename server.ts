import express from 'express';
import redbubbleControllers from './controllers/redbubble';

const port = 8080;
const app = express();

app.get('/fillRankings', async (req, res) => {
  await redbubbleControllers.fillRankings();
  res.status(200);
  res.type('txt').send('Rankings filled');
});

app.get('/fillResults', async (req, res) => {
  if (
    !req.query.start || !(typeof req.query.start === 'string') ||
        !req.query.stop || !(typeof req.query.stop === 'string')
  ) {
    res.status(400);
    res.type('txt').send('start and stop params are required');
    return;
  }

  const start = parseInt(req.query.start);
  const stop = parseInt(req.query.stop);

  await redbubbleControllers.fillResults(start, stop);
  res.status(200);
  res.type('txt').send(`Result ${start} to ${stop} filled`);
});

app.get('/', async (req, res) => {
  res.status(200);
  res.type('txt').send('API running');
});

app.get('*', function(req, res) {
  res.status(404);
  res.send('404 not found');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
