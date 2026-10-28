# Tá Pago

Contas do mês sem esquecer. Você fotografa o boleto, o app lembra o vencimento e você marca "tá pago".

Roda inteiro no navegador do celular, **offline**, hospedado só no GitHub Pages. Não usa servidor nem serviço externo, e os seus dados nunca saem do aparelho.

## Publicar no GitHub (uma vez)

1. Crie um repositório (ex.: `ta-pago`) e envie **todo o conteúdo desta pasta, incluindo a pasta `lib/`**, para a raiz.
2. **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
3. Em 1–2 minutos o app estará em `https://SEU-USUARIO.github.io/ta-pago/`.
4. No Android, abra o endereço no Chrome, toque em ⋮ e depois em **Instalar app**. Na primeira abertura com internet ele baixa tudo (~7 MB). Depois disso funciona sem internet.

> O GitHub Pages gratuito exige repositório público. O código fica visível, mas os lançamentos ficam só no celular.

## Como os documentos entram

- **Adicionar → Fotografar**, ou **Escolher fotos/PDFs** (vários de uma vez).
- **Compartilhar** do WhatsApp, do e-mail ou da galeria, escolhendo **Tá Pago** (com o app instalado).

O app identifica sozinho o tipo de documento:

| Documento | O que ele faz |
|---|---|
| Boleto bancário | Lê o código de barras ou a linha digitável: valor, vencimento, banco, beneficiário. Confere os dígitos verificadores. |
| Conta de consumo (água, luz, gás, telefone, IPTU) | Lê valor, tipo de conta, vencimento e nº da instalação pelo texto. |
| Comprovante (Pix, transferência, pagamento) | Procura a conta em aberto correspondente (mesmo código, ou mesmo item e valor, ou valor único) e **marca como paga**. Se o valor pago for maior, registra a multa. Guarda o comprovante junto. |
| Nota fiscal / cupom (NFC-e) | Lança como despesa paga (ex.: farmácia, mercado), com a chave da nota. |
| PDF | Lê o texto do PDF diretamente (mais preciso que foto). |

**Onde cada despesa vai:** o app reconhece empresas conhecidas (Light, Enel, Cedae, Naturgy, Claro, Vivo, Unimed, Drogasil, Pacheco, Uber, iFood, Google, OpenAI, Canva etc.). Quando não sabe, ou quando há mais de uma opção (por exemplo, "Luz" da casa, da praia ou da serra), ele **pergunta**. Depois que você responde, ele **aprende** pelo CNPJ, pelo nome e pelo nº da instalação e não pergunta de novo. Se a mesma empresa atende dois imóveis, ele diferencia pelo nº da instalação.

Tudo pode ser conferido e corrigido à mão. Toque em qualquer lançamento.

## Lembretes

- Notificações começam N dias antes (configurável), repetem na véspera e no dia, e todo dia enquanto a conta estiver vencida. A notificação tem o botão **✓ Tá pago**.
- O número de contas urgentes aparece no **ícone do app**.
- **Revisão da semana**: um resumo no dia que você escolher.
- **📅 Agenda**: cria eventos no calendário do celular com alarme 3 dias antes, na véspera e no dia. É o aviso mais garantido, porque o Android limita apps web em segundo plano.
- **Tá pago** em um toque, com comemoração e contador de contas pagas em dia seguidas.
- **Copiar código**: copia a linha digitável para colar no app do banco.
- As contas fixas do mês são criadas sozinhas no dia 1º, com o valor do mês anterior.

## Gráficos

- **Mês**: barra de progresso (pago × falta) e calendário com os vencimentos coloridos por situação.
- **Itens**: gráfico de 12 meses com linha de média para cada item e cada categoria.
- **Relatório**:
  - gastos por mês empilhados por categoria;
  - este mês × média de cada categoria;
  - % pagas em dia;
  - dinheiro perdido com multas;
  - gastos por forma de pagamento.
  - Pode ser impresso ou salvo em PDF.

## Dados

- Salvos automaticamente no aparelho. **Mais → Exportar CSV** gera o arquivo (`;` e vírgula decimal, abre no Excel). O backup `.json` restaura tudo, inclusive o que o app aprendeu.
- Limpar os dados do Chrome apaga o app. Exporte o CSV de vez em quando.
- Dados bancários são criptografados com PIN (AES-256). Sem o PIN, não há recuperação.

## Limitações honestas

- **Fotos**: a leitura de texto (OCR) leva alguns segundos por foto no celular. Foto reta, com boa luz e documento inteiro no quadro dá o melhor resultado. PDF é sempre melhor que foto.
- **iPhone**: funciona, mas sem compartilhar direto para o app, sem contador no ícone e com notificações mais limitadas.
- **Segundo plano**: o Android decide quando o app pode checar. Por isso existe a opção da agenda.

## Bibliotecas incluídas (pasta `lib/`, licenças livres)

Tesseract.js 5.1.1 + dados em português (OCR, Apache-2.0) · jsQR 1.4.0 (QR, Apache-2.0) · pdf.js 3.11.174 (PDF, Apache-2.0).

## Atualizar

Substitua os arquivos no repositório. Se mudar `index.html`, aumente o número em `APP = 'tapago-app-vN'` no `sw.js`.
