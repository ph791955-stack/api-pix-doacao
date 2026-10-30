const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const SYNC_PAY_BASE_URL = 'https://api.syncpayments.com.br/api/partner/v1';
const CLIENT_ID = 'a08a49be-a60a-4945-96ba-6a17a2f82334';
const CLIENT_SECRET = 'a499a072-4d86-4210-abef-2c2a9897f16d';

async function getAccessToken() {
    const response = await axios.post(`${SYNC_PAY_BASE_URL}/auth-token`, {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
    });
    return response.data.access_token;
}

app.post('/gerar-pix', async (req, res) => {
    try {
        const { amount, name, email } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Informe um valor válido.' });
        }

        const token = await getAccessToken();

        const cashInResponse = await axios.post(
            `${SYNC_PAY_BASE_URL}/cash-in`,
            {
                amount: parseFloat(amount),
                description: 'Pagamento via Pix',
                client: {
                    name: name || 'Cliente',
                    cpf: '00000000000', 
                    email: email || 'cliente@email.com'
                }
            },
            {
                headers: { Authorization: `Bearer ` + token }
            }
        );

        const pixCode = cashInResponse.data.pix_code;
        const qrCodeBase64 = await QRCode.toDataURL(pixCode);

        return res.json({
            pix_copia_e_cola: pixCode,
            qr_code_image: qrCodeBase64
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        return res.status(500).json({ error: 'Erro ao gerar o Pix na SyncPay' });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});