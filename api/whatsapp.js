import OpenAI from "openai";
import twilio from "twilio";
import querystring from "querystring";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    // 👇 Parse do body da Twilio (form-urlencoded)
    const body =
      typeof req.body === "string"
        ? querystring.parse(req.body)
        : req.body;

    const { Body, From } = body || {};

    if (!Body || !From) {
      return res.status(200).end();
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const contexto = `
Você é um agente virtual da Mercatto Delícia.
Atenda clientes no WhatsApp de forma educada, objetiva e profissional.
Se não souber responder, encaminhe para atendimento humano.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: contexto },
        { role: "user", content: Body }
      ],
      temperature: 0.3
    });

    const resposta =
      completion.choices?.[0]?.message?.content ||
      "No momento não consegui responder. Vou te encaminhar para um atendente.";

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: resposta,
      from: process.env.TWILIO_WHATSAPP_NUMBER, // whatsapp:+14155238886 (sandbox)
      to: From
    });

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("Erro no webhook:", error);
    return res.status(500).json({ error: "Erro interno no webhook" });
  }
}
