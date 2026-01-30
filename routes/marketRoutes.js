const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/prices", async (req, res) => {
  try {
    const symbols = [
      "BNBUSDT","BTCUSDT","ETHUSDT","SOLUSDT",
      "XRPUSDT","ADAUSDT","DOGEUSDT","TRXUSDT"
    ];

    const response = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      {
        params: {
          symbols: JSON.stringify(symbols)
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch market data" });
  }
});

module.exports = router;
