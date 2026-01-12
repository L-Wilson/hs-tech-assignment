require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const {
  CUSTOMER_ANALYSIS_SYSTEM_PROMPT,
  buildUserPrompt,
} = require("./prompts/customerAnalysisPrompt");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for easy frontend development)
app.use(express.static(path.join(__dirname, "public")));

// HubSpot API configuration
const HUBSPOT_API_BASE = "https://api.hubapi.com";
const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate tokens on startup
if (!HUBSPOT_TOKEN) {
  console.error("❌ ERROR: HUBSPOT_ACCESS_TOKEN not found in .env file");
  console.error(
    "Please create a .env file and add your HubSpot Private App token"
  );
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: OPENAI_API_KEY not found in .env file");
  console.warn(
    "AI-powered customer insights will not work without an OpenAI API key"
  );
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// GET endpoint - Fetch contacts from HubSpot
app.get("/api/contacts", async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          limit: 50,
          properties: "firstname,lastname,email,phone,address",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching contacts:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch contacts",
      details: error.response?.data || error.message,
    });
  }
});

// POST endpoint - Create new contact in HubSpot
app.post("/api/contacts", async (req, res) => {
  try {
    const response = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
      {
        properties: req.body.properties,
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error creating contact:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to create contact",
      details: error.response?.data || error.message,
    });
  }
});

// GET endpoint - Fetch all deals from HubSpot
app.get("/api/deals", async (req, res) => {
  try {
    const response = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        params: {
          limit: 50,
          properties: "dealname,amount,dealstage,closedate,pipeline",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching deals:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch deals",
      details: error.response?.data || error.message,
    });
  }
});

// POST endpoint - Create new deal and associate to contact
app.post("/api/deals", async (req, res) => {
  try {
    const { dealProperties, contactId } = req.body;

    console.log("Creating deal with properties:", dealProperties);
    console.log("Associating to contact ID:", contactId);

    // Create the new deal with association to contact
    const dealResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals`,
      {
        properties: dealProperties,
        associations: contactId
          ? [
              {
                to: { id: contactId },
                types: [
                  {
                    associationCategory: "HUBSPOT_DEFINED",
                    associationTypeId: 3, // Deal to Contact association
                  },
                ],
              },
            ]
          : [],
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Deal created successfully:", dealResponse.data.id);
    res.json(dealResponse.data);
  } catch (error) {
    console.error(
      "❌ Error creating deal:",
      error.response?.data || error.message
    );

    // Provide detailed error information
    const errorDetails = error.response?.data;
    const errorMessage = errorDetails?.message || error.message;
    const validationErrors = errorDetails?.errors || [];

    console.error("Error details:", {
      message: errorMessage,
      validationErrors: validationErrors,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({
      error: "Failed to create deal",
      message: errorMessage,
      details: errorDetails,
      validationErrors: validationErrors
    });
  }
});

// GET endpoint - Fetch deals associated with a specific contact
app.get("/api/contacts/:contactId/deals", async (req, res) => {
  try {
    const { contactId } = req.params;

    // First, get the deal associations for this contact
    const associationsResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}/associations/deals`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // If there are associated deals, fetch their full details
    if (
      associationsResponse.data.results &&
      associationsResponse.data.results.length > 0
    ) {
      const dealIds = associationsResponse.data.results.map((r) => r.id);

      const dealsResponse = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/deals/batch/read`,
        {
          inputs: dealIds.map((id) => ({ id })),
          properties: [
            "dealname",
            "amount",
            "dealstage",
            "closedate",
            "pipeline",
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.json(dealsResponse.data);
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error(
      "Error fetching deals for contact:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch deals for contact",
      details: error.response?.data || error.message,
    });
  }
});

// POST endpoint - AI-powered customer analysis (privacy-preserving)
app.post("/api/ai/analyze", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OpenAI API key not configured",
        details: "Please add OPENAI_API_KEY to your .env file",
      });
    }

    const { customerProfile } = req.body;

    // Validate that we're not receiving PII
    if (!customerProfile || typeof customerProfile !== "object") {
      return res.status(400).json({
        error: "Invalid request",
        details: "customerProfile is required and must be an object",
      });
    }

    // Build the OpenAI prompts using external prompt file
    const systemPrompt = CUSTOMER_ANALYSIS_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(customerProfile);

    // Call OpenAI API
    const openAIResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = JSON.parse(
      openAIResponse.data.choices[0].message.content
    );

    res.json({
      insights: aiResponse,
      metadata: {
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "Error analyzing customer with AI:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to analyze customer",
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log("\n✅ Server running successfully!");
  console.log(`🌐 API available at: http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log("\n💡 Using hot-reload? Run: npm run dev");
  console.log("🛑 To stop server: Press Ctrl+C\n");
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Received ${signal}, closing server gracefully...`);

  server.close(() => {
    console.log("✅ Server closed successfully");
    console.log("👋 Goodbye!\n");
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
