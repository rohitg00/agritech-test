# agritech-test

A production-ready RAG (Retrieval Augmented Generation) system for managing harvest logs with AI-powered querying, converted from n8n to Motia.

## 🏗️ System Architecture

```
POST /harvest_logbook → Process Embeddings → Pinecone Vector Store
                     ↓
                     Query Agent (RAG) → Log Results
```

### Components

**API Steps:**
- `POST /harvest_logbook` - Store harvest data (with optional query)
- `POST /harvest_logbook/query` - Query knowledge base only

**Event Steps:**
- `ProcessEmbeddings` - Split text, generate embeddings, store in Pinecone
- `QueryAgent` - RAG query with context retrieval + LLM generation
- `LogToSheets` - Log queries and responses

**Services:**
- OpenAI - Embeddings (text-embedding-ada-002)
- Pinecone - Vector storage and similarity search
- OpenAI Chat / HuggingFace - LLM for response generation
- CSV Logger / Google Sheets - Audit logging

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
# OpenAI (Required for embeddings and chat)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Pinecone (Required for vector storage)
PINECONE_API_KEY=pcsk_xxxxxxxxxxxxx
PINECONE_INDEX_HOST=your-index-abc123.svc.us-east-1.pinecone.io

# AuthZed/SpiceDB (Required for authorization)
AUTHZED_ENDPOINT=grpc.authzed.com:443
AUTHZED_TOKEN=tc_your_authzed_token_xxxxxxxxxxxxx

# LLM Configuration (Choose one)
USE_OPENAI_CHAT=true              # Recommended: Use OpenAI for chat
# USE_OPENAI_CHAT=false           # Alternative: Use HuggingFace
# HUGGINGFACE_API_KEY=hf_xxxxxxx # Required if USE_OPENAI_CHAT=false

# Logging Configuration (Choose one)
USE_CSV_LOGGER=true               # Recommended for testing: Local CSV
# USE_CSV_LOGGER=false            # Production: Google Sheets
# GOOGLE_SHEETS_ID=xxxxxxxx       # Required if USE_CSV_LOGGER=false
# GOOGLE_SHEETS_ACCESS_TOKEN=xxx  # Required if USE_CSV_LOGGER=false
```

### 3. Get Pinecone Index Host

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Click your index → **Connect** tab
3. Copy the **Host** value (e.g., `your-index-abc123.svc.us-east-1.pinecone.io`)
4. Paste into `PINECONE_INDEX_HOST` in `.env`

### 4. Create Pinecone Index

- **Name**: `harvest_logbook` (or your preference)
- **Dimensions**: `1536` (for OpenAI embeddings)
- **Metric**: `cosine`

### 5. Setup AuthZed/SpiceDB

#### Option A: Use AuthZed Cloud (Recommended for development)
1. Sign up at [AuthZed Dashboard](https://app.authzed.com/)
2. Create a new permission system
3. Get your API token (starts with `tc_`)
4. Add to `.env`: `AUTHZED_TOKEN=tc_your_token_here`

#### Option B: Use SpiceDB Locally
```bash
# Using Docker
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  authzed/spicedb serve \
  --grpc-preshared-key "local_development_key"

# Add to .env
AUTHZED_ENDPOINT=localhost:50051
AUTHZED_TOKEN=local_development_key
```

### 6. Initialize Authorization Schema
```bash
# Write the authorization schema to SpiceDB
npx ts-node scripts/setup-authzed-schema.ts

# Verify the schema was written correctly
npx ts-node scripts/verify-authzed-schema.ts

# Create sample permissions for testing
npx ts-node scripts/create-sample-permissions.ts
```

### 7. Start Server
```bash
npm run dev
```

## 📝 Usage

**Note:** All requests require authorization headers. Use the `x-user-id` header to identify the user making the request.

### Store Harvest Data

```bash
curl -X POST http://localhost:3000/harvest_logbook \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_alice" \
  -d '{
    "content": "Harvested 500kg of tomatoes from field A. Weather was sunny, no pest damage observed.",
    "farmId": "farm_1",
    "metadata": {
      "field": "A",
      "crop": "tomatoes",
      "weight_kg": 500
    }
  }'
```

### Store Data + Query

```bash
curl -X POST http://localhost:3000/harvest_logbook \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_alice" \
  -d '{
    "content": "Harvested 300kg of corn from field B.",
    "farmId": "farm_1",
    "query": "What is the total harvest weight today?",
    "metadata": {
      "field": "B",
      "crop": "corn"
    }
  }'
```

### Query Only

```bash
curl -X POST http://localhost:3000/harvest_logbook/query \
  -H "Content-Type: application/json" \
  -H "x-user-id: user_alice" \
  -d '{
    "farmId": "farm_1",
    "query": "Which crops had pest damage this week?"
  }'
```

### View Logs

**CSV Logging** (default):
```bash
cat logs/harvest_logbook.csv
```

**Google Sheets**: Check your spreadsheet

## 🔄 Configuration Alternatives

### LLM Provider: OpenAI Chat vs HuggingFace

**Default: OpenAI Chat** (Recommended)
```bash
USE_OPENAI_CHAT=true
OPENAI_API_KEY=sk-proj-xxxxx
```

**Alternative: HuggingFace**
```bash
USE_OPENAI_CHAT=false
HUGGINGFACE_API_KEY=hf_xxxxx  # Requires inference API permissions
```

**Code Location:**
```typescript
// src/services/harvest-logbook/index.ts (line 72)
const useOpenAIChat = process.env.USE_OPENAI_CHAT === 'true' || !process.env.HUGGINGFACE_API_KEY;

if (useOpenAIChat) {
  const openaiChat = getOpenAIChatService();
  response = await openaiChat.generateWithContext(...);
} else {
  const huggingface = getHuggingFaceService();
  response = await huggingface.generateWithContext(...);
}
```

### Logging: CSV vs Google Sheets

**Default: CSV Logger** (Testing)
```bash
USE_CSV_LOGGER=true
# Logs saved to: logs/harvest_logbook.csv
```

**Alternative: Google Sheets** (Production)
```bash
USE_CSV_LOGGER=false
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_ACCESS_TOKEN=your_oauth_token
```

**Code Location:**
```typescript
// src/services/harvest-logbook/index.ts (line 134)
const useCSV = process.env.USE_CSV_LOGGER === 'true' || !process.env.GOOGLE_SHEETS_ID;

if (useCSV) {
  const csvLogger = getCSVLogger();
  await csvLogger.logEntry(entry);
} else {
  const sheets = getGoogleSheetsService();
  await sheets.logEntry(entry);
}
```

## 🔧 n8n to Motia Conversion

### Original n8n Workflow

```
Webhook → Splitter → Embeddings → Insert (Pinecone)
   ↓                                     ↓
Memory → Agent ←─── Query (Pinecone) ←──┘
   ↓         ↓
   └────→ Sheet
```

### Motia Implementation

| n8n Node | Motia Component | File |
|----------|----------------|------|
| Webhook | API Step: `ReceiveHarvestData` | `steps/harvest-logbook/receive-harvest-data.step.ts` |
| Splitter | Utility: `splitText()` | `src/services/harvest-logbook/text-splitter.ts` |
| Embeddings | Service: `OpenAIService` | `src/services/harvest-logbook/openai-service.ts` |
| Insert | Service: `PineconeService.upsert()` | `src/services/harvest-logbook/pinecone-service.ts` |
| Query | Service: `PineconeService.query()` | `src/services/harvest-logbook/pinecone-service.ts` |
| Tool | Built into `QueryAgent` | `steps/harvest-logbook/query-agent.step.ts` |
| Memory | Conversation history in state | Built-in state management |
| Chat | Service: `OpenAIChatService` or `HuggingFaceService` | `src/services/harvest-logbook/` |
| Agent | Event Step: `QueryAgent` | `steps/harvest-logbook/query-agent.step.ts` |
| Sheet | Service: `CSVLogger` or `GoogleSheetsService` | `src/services/harvest-logbook/` |

### Configuration Changes from n8n

**Text Chunking:**
- n8n: `chunkSize: 400, chunkOverlap: 40`
- Motia: Same - configured in `text-splitter.ts`

**Vector Database:**
- n8n: Pinecone with hardcoded index name
- Motia: Configurable via `PINECONE_INDEX_HOST` environment variable

**LLM:**
- n8n: HuggingFace only
- Motia: **OpenAI Chat (default)** or HuggingFace via `USE_OPENAI_CHAT` flag

**Logging:**
- n8n: Google Sheets only
- Motia: **CSV Logger (default)** or Google Sheets via `USE_CSV_LOGGER` flag

## 🛠️ Project Structure

```
agritech-proj/
├── src/services/harvest-logbook/
│   ├── types.ts                    # Type definitions
│   ├── text-splitter.ts           # Text chunking (400/40)
│   ├── openai-service.ts          # Embeddings
│   ├── openai-chat-service.ts     # OpenAI chat (alternative)
│   ├── huggingface-service.ts     # HuggingFace chat (alternative)
│   ├── pinecone-service.ts        # Vector storage
│   ├── csv-logger.ts              # CSV logging (alternative)
│   ├── sheets-service.ts          # Google Sheets (alternative)
│   └── index.ts                   # Main orchestration
├── steps/harvest-logbook/
│   ├── receive-harvest-data.step.ts    # API: POST /harvest_logbook
│   ├── receive-harvest-data.step.tsx   # UI component
│   ├── process-embeddings.step.ts      # Event: Embedding processing
│   ├── process-embeddings.step.tsx     # UI component
│   ├── query-agent.step.ts             # Event: AI agent query
│   ├── query-agent.step.tsx            # UI component
│   ├── query-only.step.ts              # API: POST /harvest_logbook/query
│   ├── query-only.step.tsx             # UI component
│   ├── log-to-sheets.step.ts           # Event: Logging
│   └── log-to-sheets.step.tsx          # UI component
└── README.md                       # This file
```

## 🎨 Motia Workbench

Each step includes custom UI components for beautiful visualization:
- 🌾 Harvest Entry - Webhook with metadata display
- 🧬 Process Embeddings - Shows chunking parameters
- 🤖 AI Agent - RAG pipeline with source indicators
- 📊 Log Results - CSV or Sheets destination
- 🔍 Query Only - Separate query endpoint

## 📊 State Management

The system uses Motia's built-in state management:

- `harvest-entries` - Temporary storage for incoming data
- `harvest-vectors` - Maps entry IDs to vector IDs in Pinecone
- `agent-responses` - Caches AI responses

## 🔐 Security & Authorization

### AuthZed/SpiceDB Integration

The system uses AuthZed (SpiceDB) for fine-grained authorization:

**Resource Hierarchy:**
```
Organization
  ├── Farms
  │   └── Harvest Entries
  └── Users (with roles)
```

**Roles & Permissions:**
- **Organization Admin**: Full control over organization, farms, and data
- **Organization Member**: Can view, edit, and query all organization data
- **Farm Owner**: Full control over specific farm and its data
- **Farm Editor**: Can add harvest entries and query farm data
- **Farm Viewer**: Can view harvest data and query results

**Permission Model:**
```typescript
// Users must have appropriate permissions:
- 'view': View harvest data
- 'edit': Create new harvest entries
- 'query': Execute RAG queries
- 'manage': Administrative operations
```

**Authorization Flow:**
1. User sends request with `x-user-id` header
2. Middleware checks user's permission on the specified farm
3. Request proceeds only if user has required permission
4. Authorization context available in handlers

### Security Features

- Fine-grained access control via SpiceDB
- All API keys in environment variables
- Input validation via Zod schemas
- Error handling with retry logic
- No sensitive data in logs
- User context tracking in all operations

## 🚀 Production Considerations

### Switch to Google Sheets
```bash
USE_CSV_LOGGER=false
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_ACCESS_TOKEN=your_oauth_token
```

### Use HuggingFace (if preferred)
```bash
USE_OPENAI_CHAT=false
HUGGINGFACE_API_KEY=hf_your_token_with_inference_permissions
```

### Configure Production AuthZed
Update `.env` with production AuthZed endpoint and token

### Enable Rate Limiting
Add rate limiting middleware to prevent abuse

### Monitor Performance
- Check Pinecone dashboard for vector stats
- Monitor OpenAI API usage
- Track response times in logs

## 🐛 Troubleshooting

### "fetch failed" - Pinecone Connection
**Issue**: `PINECONE_INDEX_HOST` not set or incorrect

**Solution**:
1. Get host from Pinecone Console → Your Index → Connect tab
2. Add to `.env`: `PINECONE_INDEX_HOST=your-index-abc123.svc.us-east-1.pinecone.io`
3. Restart server

### "403" - HuggingFace Permissions
**Issue**: API key lacks inference permissions

**Solution**: Switch to OpenAI Chat (recommended)
```bash
USE_OPENAI_CHAT=true
```

Or fix HuggingFace token permissions at https://huggingface.co/settings/tokens

### CSV Logs Not Created
**Issue**: Directory not initialized

**Solution**: System creates `logs/` automatically. If issues persist:
```bash
mkdir logs
```

### Empty Query Results
**Issue**: No data stored in Pinecone yet

**Solution**: First store some data before querying

## 📚 Key Features

✅ **Type Safety** - Full TypeScript with Zod validation
✅ **Scalability** - Event-driven, horizontally scalable
✅ **Flexibility** - Swap LLM providers and logging backends via config
✅ **RAG Pipeline** - Vector similarity search + context-aware generation
✅ **State Management** - Built-in coordination between steps
✅ **Error Handling** - Automatic retries and detailed error messages
✅ **Beautiful UI** - Custom Workbench components for each step

## 🤝 Development

### Generate Types
```bash
npm run generate-types
```

### Build
```bash
npm run build
```

### Clean
```bash
npm run clean
```

## 📖 Resources

- [Motia Documentation](https://motia.dev/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Pinecone Docs](https://docs.pinecone.io/)
- [HuggingFace Inference](https://huggingface.co/docs/api-inference)
- [AuthZed Documentation](https://docs.authzed.com/)
- [SpiceDB](https://github.com/authzed/spicedb)

---

**Built with ❤️ using Motia** - Converted from n8n to production-ready scalable backend
