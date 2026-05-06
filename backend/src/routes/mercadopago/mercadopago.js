const { MercadoPagoConfig, Preference } = require('mercadopago');
require('dotenv').config();

// Nova configuração do SDK Mercado Pago (v3+)
const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

// Cria preferência de pagamento
async function createPreference(req, res) {
  try {
    const { orderId, items, payer } = req.body;
    // items: [{ title, quantity, unit_price, currency_id }]
    // payer: { email }
    const preference = {
      items,
      payer,
      external_reference: orderId,
      back_urls: {
        success: process.env.MP_RETURN_URL_SUCCESS,
        failure: process.env.MP_RETURN_URL_FAILURE,
        pending: process.env.MP_RETURN_URL_PENDING
      },
      auto_return: 'approved',
      notification_url: process.env.MP_WEBHOOK_URL
    };
    const preferenceClient = new Preference(mp);
    const result = await preferenceClient.create({ body: preference });
    res.json({ init_point: result.init_point });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Webhook para notificações de pagamento
async function paymentWebhook(req, res) {
  // Mercado Pago envia POST com info do pagamento
  // Aqui você pode validar e atualizar o status do pedido
  res.sendStatus(200);
}

module.exports = { createPreference, paymentWebhook };
