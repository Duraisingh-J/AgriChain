import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
const { twiml } = twilio;
import dotenv from 'dotenv';
import { listProduce } from './farmerMarket.js';
import phoneToAddr from '../shared/phoneToAddr.js';

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Entry point: welcome and prompt for crop code
app.post('/voice', (req, res) => {
  const response = new twiml.VoiceResponse();
  const gather = response.gather({
    action: '/quantity',
    method: 'POST',
    numDigits: 2,
  });
  gather.say('Welcome to AgriChain. Enter crop code. For Tomato press 0 1. For Rice press 0 2.');
  res.type('text/xml');
  res.send(response.toString());
});

// Ask for quantity
app.post('/quantity', (req, res) => {
  const cropCode = req.body.Digits;
  const response = new twiml.VoiceResponse();
  const gather = response.gather({
    action: `/price?cropCode=${cropCode}`,
    method: 'POST',
    numDigits: 3,
  });
  gather.say(`Enter quantity in kilograms for crop code ${cropCode}`);
  res.type('text/xml');
  res.send(response.toString());
});

// Ask for price
app.post('/price', (req, res) => {
  const { cropCode } = req.query;
  const quantity = req.body.Digits;
  const response = new twiml.VoiceResponse();
  const gather = response.gather({
    action: `/finalize?cropCode=${cropCode}&qty=${quantity}`,
    method: 'POST',
    numDigits: 3,
  });
  gather.say('Enter price per kilogram');
  res.type('text/xml');
  res.send(response.toString());
});

// Finalize and post to blockchain
app.post('/finalize', async (req, res) => {
  const { cropCode, qty } = req.query;
  const price = req.body.Digits;
  const phone = req.body.From;

  const response = new twiml.VoiceResponse();
  try {
    const farmerAddr = phoneToAddr[phone];
    if (!farmerAddr) throw new Error('Phone number not mapped');

    const txHash = await listProduce(farmerAddr, cropCode, qty, price);
    response.say(`Listing successful. Transaction hash ending ${txHash.slice(-6)}. Thank you.`);
  } catch (err) {
    console.error(err);
    response.say('Sorry, there was an error submitting your listing.');
  }

  res.type('text/xml');
  res.send(response.toString());
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ IVR server listening on port ${PORT}`);
});
