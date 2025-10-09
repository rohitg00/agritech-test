# How to Submit This Example to motia-examples

## Quick Submission Guide

### 1. Fork the Repository

Go to https://github.com/MotiaDev/motia-examples and click "Fork"

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/motia-examples.git
cd motia-examples
```

### 3. Copy This Example

```bash
# From your agritech-proj directory
cp -r examples/harvest-logbook-rag ../motia-examples/examples/
```

### 4. Create a Branch

```bash
cd ../motia-examples
git checkout -b add-harvest-logbook-rag-example
```

### 5. Commit Your Changes

```bash
git add examples/harvest-logbook-rag
git commit -m "Add Harvest Logbook RAG System example

- Complete RAG pipeline with vector search
- OpenAI embeddings and chat integration
- Pinecone vector database
- Flexible configuration (OpenAI/HuggingFace, CSV/Sheets)
- Event-driven architecture
- Custom Workbench UI components
- Production-ready with error handling
"
```

### 6. Push to Your Fork

```bash
git push origin add-harvest-logbook-rag-example
```

### 7. Create Pull Request

1. Go to https://github.com/YOUR_USERNAME/motia-examples
2. Click "Contribute" → "Open pull request"
3. Fill in the PR template:

**Title**: Add Harvest Logbook RAG System Example

**Description**:
```
## What This Example Demonstrates

A production-ready RAG (Retrieval Augmented Generation) system for managing harvest logs with AI-powered querying.

### Key Features
- Complete RAG pipeline implementation
- Vector embeddings with OpenAI
- Semantic search with Pinecone
- Event-driven async processing
- Flexible LLM configuration (OpenAI/HuggingFace)
- Multiple logging options (CSV/Google Sheets)
- Custom Motia Workbench UI components

### Technologies
- TypeScript
- OpenAI (embeddings + chat)
- Pinecone (vector database)
- Motia (framework)

### Use Cases
- Agriculture data management
- Knowledge base systems
- Document search and Q&A
- Customer support automation

### Testing
- ✅ All endpoints tested
- ✅ Documentation complete
- ✅ Environment template included
- ✅ Error handling implemented

This example shows how to build production-ready RAG systems with Motia, including configuration alternatives and best practices.
```

4. Submit the PR!

## Alternative: Direct Contribution

If you're a contributor to the main repository:

```bash
# Clone main repo
git clone https://github.com/MotiaDev/motia-examples.git
cd motia-examples

# Copy example
cp -r /path/to/agritech-proj/examples/harvest-logbook-rag examples/

# Create branch and commit
git checkout -b add-harvest-logbook-rag
git add examples/harvest-logbook-rag
git commit -m "Add Harvest Logbook RAG System example"
git push origin add-harvest-logbook-rag

# Create PR on GitHub
```

## What's Included

✅ Complete source code (src/ and steps/)
✅ Comprehensive README with examples
✅ Environment configuration template  
✅ Contributing guidelines
✅ Submission documentation
✅ Custom UI components
✅ TypeScript configuration
✅ Motia workbench config

## Checklist Before Submitting

- [ ] All code is working and tested
- [ ] README is complete with setup instructions
- [ ] .env.example includes all required variables
- [ ] No sensitive data (API keys, tokens) in code
- [ ] Code follows Motia best practices
- [ ] Custom UI components are included
- [ ] Documentation includes troubleshooting section

## Questions?

Refer to the main repository's [CONTRIBUTING.md](https://github.com/MotiaDev/motia-examples/blob/main/CONTRIBUTING.md) for more details.
