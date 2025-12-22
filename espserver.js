
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8087 });
import mongoose from 'mongoose';

// ---------------- MongoDB / Mongoose Setup ----------------
const MONGO_URI = 'mongodb://localhost:27017/earthquakeDB_RedFalcon';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB via Mongoose'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const eventSchema = new mongoose.Schema({
  espid: { type: String, required: true },
  baseid: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  magnitude: { type: Number, required: true },
  type: { type: String, default: 'storm' },
  timestamp: { type: Date, default: Date.now }
});

// Create Mongoose Model
const Event = mongoose.model('Event', eventSchema);

wss.on('connection', function fun(ws) {
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'info', payload: 'Connection on' }));
  }, 1000);
  ws.on('message', async function messagefun(message) {
    try {
      const data = JSON.parse(message.toString());
      const { espid, location, magnitude, baseid, type } = data;

      if (!espid || !baseid || !location || !location.lat || !location.lng || !magnitude) {
        ws.send(JSON.stringify({ type: 'error', payload: 'Missing required fields' }));
        return;
      }

      console.log(`Received data from ESP: ${espid}, Location: (${location.lat}, ${location.lng}), Magnitude: ${magnitude}, BaseID: ${baseid}`);

      // Insert into MongoDB via Mongoose
      const event = new Event({
        espid,
        baseid,
        location,
        magnitude,
        type: type || 'storm'
      });

      const savedEvent = await event.save();
      console.log('Inserted into DB with ID:', savedEvent._id);

      // Acknowledge back to ESP
      ws.send(JSON.stringify({ type: 'ack', payload: 'Data stored', id: savedEvent._id }));
      
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', function cls() {
    // Clean up
    console.log('Client disconnected');
  });
});



console.log('🚀 WebSocket server started on ws://localhost:8089');