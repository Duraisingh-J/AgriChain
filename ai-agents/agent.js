const axios = require("axios");
const ethers = require("ethers");
const readline = require("readline");
const admin = require("firebase-admin");
const { rpcUrl, privateKey, contractAddress, abi } = require("./config");

// Initialize Firebase Admin
console.log("🔧 Initializing Firebase...");

// Method 1: Try Service Account Key first (most reliable)
try {
  const serviceAccount = require("./serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // No databaseURL needed for Firestore
  });
  console.log("✅ Firebase initialized with service account key");
} catch (serviceAccountError) {
  console.log("⚠️ Service account key not found, trying environment variables...");
  
  // Method 2: Try using environment variables
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || "agrichain-74c2d"
  };
  
  // Check if we have a service account JSON string in environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...firebaseConfig
      });
      console.log("✅ Firebase initialized with environment service account");
    } catch (envError) {
      console.error("❌ Failed to parse service account from environment:", envError.message);
      process.exit(1);
    }
  } else {
    // Method 3: Last resort - try application default (requires gcloud auth)
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        ...firebaseConfig
      });
      console.log("✅ Firebase initialized with application default credentials");
    } catch (defaultError) {
      console.error("❌ Firebase initialization failed!");
      console.error("Please set up Firebase credentials using one of these methods:");
      console.error("1. Download serviceAccountKey.json from Firebase Console");
      console.error("2. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable");
      console.error("3. Run 'gcloud auth application-default login'");
      process.exit(1);
    }
  }
}

// Use Firestore instead of Realtime Database
const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q) => new Promise((res) => rl.question(q, res));

// Firebase helper functions updated for Firestore
async function getProduceFromFirebase(farmerId = null) {
  try {
    console.log("🔥 Fetching produce data from Firestore...");
    
    let query;
    if (farmerId) {
      query = db.collection('products').where('farmerId', '==', farmerId);
    } else {
      query = db.collection('products').where('status', '==', 'pending');
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log("📭 No produce data found in Firestore");
      return null;
    }
    
    const produceList = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id; // Add document ID
      produceList.push(data);
    });
    
    return produceList;
    
  } catch (err) {
    console.error("❌ Firestore Error:", err.message);
    throw err;
  }
}

async function listenToFirebaseChanges(callback) {
  console.log("👂 Listening for new produce listings...");
  
  const query = db.collection('products').where('status', '==', 'pending');
  
  const unsubscribe = query.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const newProduce = change.doc.data();
        newProduce.id = change.doc.id;
        console.log(`🆕 New produce listing detected: ${newProduce.item || newProduce.product}`);
        callback(newProduce);
      }
      
      if (change.type === 'modified') {
        const updatedProduce = change.doc.data();
        updatedProduce.id = change.doc.id;
        console.log(`🔄 Produce listing updated: ${updatedProduce.item || updatedProduce.product}`);
        callback(updatedProduce);
      }
    });
  });
  
  // Return function to stop listening
  return unsubscribe;
}

async function updateProduceStatus(produceId, status, matchDetails = null) {
  try {
    const updateData = {
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (matchDetails) {
      updateData.matchedBuyer = matchDetails;
      updateData.matchedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await db.collection('products').doc(produceId).update(updateData);
    console.log(`✅ Updated produce status to: ${status}`);
    
    // If matched, also create a record in matched collection
    if (matchDetails) {
      const produceDoc = await db.collection('products').doc(produceId).get();
      if (produceDoc.exists) {
        await db.collection('matched').doc(produceId).set({
          ...produceDoc.data(),
          ...updateData
        });
      }
    }
    
  } catch (err) {
    console.error("❌ Firestore Update Error:", err.message);
  }
}

async function extractProductDetails(input) {
  try {
    // Handle Firestore data format
    if (typeof input === 'object' && input !== null) {
      console.log("🔥 Processing Firestore data object");
      
      // Direct Firestore object with 'item' field
      if (input.item && input.quantity && input.price) {
        return {
          item: input.item.toLowerCase().trim(),
          quantity: Math.abs(parseInt(input.quantity)),
          price: Math.abs(parseInt(input.price)),
          farmerId: input.farmerId || null,
          id: input.id || null
        };
      }
      
      // Alternative field names (product, qty, pricePerKg)
      if (input.product && input.qty && input.pricePerKg) {
        return {
          item: input.product.toLowerCase().trim(),
          quantity: Math.abs(parseInt(input.qty)),
          price: Math.abs(parseInt(input.pricePerKg)),
          farmerId: input.farmerId || null,
          id: input.id || null
        };
      }
      
      // Handle different possible field combinations
      if (input.name && input.quantity && input.price) {
        return {
          item: input.name.toLowerCase().trim(),
          quantity: Math.abs(parseInt(input.quantity)),
          price: Math.abs(parseInt(input.price)),
          farmerId: input.farmerId || null,
          id: input.id || null
        };
      }
      
      throw new Error("Firestore object missing required fields");
    }
    
    // Handle JSON string
    let jsonData;
    try {
      jsonData = JSON.parse(input);
      console.log("📄 Parsed JSON input successfully");
      
      // Extract from JSON format
      if (jsonData.item && jsonData.quantity && jsonData.price) {
        return {
          item: jsonData.item.toLowerCase().trim(),
          quantity: Math.abs(parseInt(jsonData.quantity)),
          price: Math.abs(parseInt(jsonData.price)),
          farmerId: jsonData.farmerId || null,
          id: jsonData.id || null
        };
      }
      
      // Handle different JSON field names
      if (jsonData.product && jsonData.qty && jsonData.pricePerKg) {
        return {
          item: jsonData.product.toLowerCase().trim(),
          quantity: Math.abs(parseInt(jsonData.qty)),
          price: Math.abs(parseInt(jsonData.pricePerKg)),
          farmerId: jsonData.farmerId || null,
          id: jsonData.id || null
        };
      }
      
      throw new Error("JSON missing required fields (item, quantity, price)");
      
    } catch (jsonErr) {
      // Not valid JSON, treat as natural language
      console.log("🔄 Input is not JSON, using local parser...");
    }
    
    // If not JSON, use the original text parsing
    const patterns = [
      /(\d+)\s*kg\s*of\s*([^,@]+).*?(?:@|₹|minimum)\s*₹?(\d+)/i,
      /(\d+)\s*kg\s*([^,@]+).*?(?:@|₹)\s*₹?(\d+)/i,
      /(\d+)\s*kg\s*([a-zA-Z]+).*?(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return {
          item: match[2].trim().toLowerCase(),
          quantity: parseInt(match[1]),
          price: parseInt(match[3]),
          farmerId: null,
          id: null
        };
      }
    }
    
    throw new Error("Could not understand input format");
    
  } catch (err) {
    console.error("❌ Extraction failed:", err.message);
    throw err;
  }
}

async function findOnChainMatch(item, quantity, price) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  try {
    // Debug: Check if there are any buyers using the existing function
    const allBuyers = await contract.getBuyers();
    console.log(`📊 Total buyers in contract: ${allBuyers.length}`);
    
    if (allBuyers.length === 0) {
      console.log("💡 No buyers registered yet. Consider adding test data.");
      return null;
    }

    // Manual matching since the contract function reverts
    console.log(`🔍 Looking for buyers wanting ${item} (min ${quantity}kg @ ₹${price}/kg)`);
    
    for (const buyer of allBuyers) {
      console.log(`   Checking: ${buyer.name} wants ${buyer.quantity} ${buyer.item} @ ₹${buyer.pricePerKg}/kg`);
      
      // Check if items match (case insensitive)
      const itemMatch = buyer.item.toLowerCase() === item.toLowerCase();
      // Check if buyer wants enough quantity
      const quantityMatch = buyer.quantity >= quantity;
      // Check if buyer's price is >= farmer's minimum price
      const priceMatch = buyer.pricePerKg >= price;
      
      console.log(`   Match check: item=${itemMatch}, quantity=${quantityMatch}, price=${priceMatch}`);
      
      if (itemMatch && quantityMatch && priceMatch) {
        return {
          name: buyer.name,
          quantity: buyer.quantity.toString(),
          price: buyer.pricePerKg.toString(),
          buyer: buyer.buyer
        };
      }
    }
    
    return null;

  } catch (err) {
    console.error("⚠️ Blockchain Error:", err.reason || err.message);
    return null;
  }
}

// Add function to populate test data
async function addTestData() {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  try {
    console.log("🧪 Adding test buyer data...");
    
    // Check current nonce to avoid conflicts
    const currentNonce = await provider.getTransactionCount(wallet.address);
    console.log(`📊 Current nonce: ${currentNonce}`);
    
    // Add some test buyers
    const testBuyers = [
      { name: "Restaurant A", item: "potatoes", quantity: 50, price: 35 },
      { name: "Store B", item: "onions", quantity: 100, price: 25 },
      { name: "Hotel C", item: "tomatoes", quantity: 75, price: 40 }
    ];

    for (let i = 0; i < testBuyers.length; i++) {
      const buyer = testBuyers[i];
      try {
        const tx = await contract.registerBuyer(
          buyer.name,
          buyer.item,
          buyer.quantity,
          buyer.price,
          {
            nonce: currentNonce + i, // Explicit nonce management
            gasLimit: 500000
          }
        );
        await tx.wait();
        console.log(`✅ Added buyer: ${buyer.name}`);
        
        // Small delay to avoid nonce conflicts
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (buyerErr) {
        console.log(`⚠️ Buyer ${buyer.name} might already exist or nonce issue: ${buyerErr.message}`);
      }
    }

    console.log("🎉 Test data addition completed!");
  } catch (err) {
    console.error("❌ Error adding test data:", err.message);
  }
}

async function addTestFirebaseData() {
  try {
    console.log("🔥 Adding test produce data to Firestore...");
    
    const testProduce = [
      {
        item: "potatoes",
        quantity: 100,
        price: 30,
        farmerId: "farmer1",
        farmerName: "John Doe",
        location: "Punjab",
        harvestDate: "2024-12-01",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        item: "onions",
        quantity: 200,
        price: 20,
        farmerId: "farmer2",
        farmerName: "Jane Smith",
        location: "Maharashtra",
        harvestDate: "2024-12-02",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        item: "tomatoes",
        quantity: 150,
        price: 35,
        farmerId: "farmer3",
        farmerName: "Raj Patel",
        location: "Karnataka",
        harvestDate: "2024-12-03",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const produce of testProduce) {
      await db.collection('products').add(produce);
      console.log(`✅ Added produce: ${produce.item} by ${produce.farmerName}`);
    }
    
    console.log("🎉 Test Firestore data added successfully!");
  } catch (err) {
    console.error("❌ Error adding test Firestore data:", err.message);
  }
}

async function processProduceListing(produceData) {
  try {
    console.log(`\n🌾 Processing produce listing: ${produceData.item || produceData.product}`);
    
    // Extract product details
    const { item, quantity, price, farmerId, id } = await extractProductDetails(produceData);
    console.log(`✅ Extracted: ${quantity}kg ${item} @ ₹${price}/kg`);
    
    // Update status to processing
    if (id) {
      await updateProduceStatus(id, 'processing');
    }
    
    // Find on-chain match
    console.log("🔍 Searching blockchain for buyers...");
    const match = await findOnChainMatch(item, quantity, price);
    
    if (match) {
      console.log(`🎯 Match Found!`);
      console.log(`👤 Buyer: ${match.name}`);
      console.log(`📦 Quantity: ${match.quantity}kg`);
      console.log(`💰 Price: ₹${match.price}/kg`);
      console.log(`🔗 Address: ${match.buyer}`);
      
      // Update Firestore with match details
      if (id) {
        await updateProduceStatus(id, 'matched', match);
      }
      
      return match;
    } else {
      console.log("❌ No matching buyers found at your price point.");
      console.log("💡 Try lowering your price or check if buyers are registered.");
      
      // Update status to no match
      if (id) {
        await updateProduceStatus(id, 'no_match');
      }
      
      return null;
    }
  } catch (err) {
    console.error("❌ Processing Error:", err.message);
    
    // Update status to error
    if (produceData.id) {
      await updateProduceStatus(produceData.id, 'error');
    }
    
    return null;
  }
}

async function runAgent() {
  try {
    console.log("\n🤖 AgriChain Farmer Agent v3.0 - Firestore Edition");
    console.log("🔥 Connected to Firestore for real-time produce matching");
    
    const mode = await ask("🔧 Select mode:\n1. Process existing Firestore data\n2. Listen for new Firestore data\n3. Add test data\n4. Manual input\nEnter choice (1-4): ");
    
    switch (mode) {
      case '1':
        // Process existing Firestore data
        console.log("\n📊 Processing existing Firestore data...");
        const existingProduce = await getProduceFromFirebase();
        
        if (existingProduce && existingProduce.length > 0) {
          console.log(`Found ${existingProduce.length} produce listings`);
          
          for (const produce of existingProduce) {
            await processProduceListing(produce);
            // Small delay between processing
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          console.log("No existing produce data found");
        }
        break;
        
      case '2':
        // Listen for new Firestore data
        console.log("\n👂 Starting real-time listener...");
        console.log("🔔 Waiting for new produce listings...");
        
        const unsubscribe = await listenToFirebaseChanges(async (newProduce) => {
          await processProduceListing(newProduce);
        });
        
        // Keep the process running
        await ask("Press Enter to stop listening...");
        unsubscribe();
        break;
        
      case '3':
        // Add test data
        const testType = await ask("Add test data to:\n1. Firestore\n2. Blockchain\n3. Both\nEnter choice (1-3): ");
        
        if (testType === '1' || testType === '3') {
          await addTestFirebaseData();
        }
        
        if (testType === '2' || testType === '3') {
          await addTestData();
        }
        break;
        
      case '4':
        // Manual input (original functionality)
        const inputText = await ask("📝 Enter your produce details (JSON or text): ");
        const produceData = await extractProductDetails(inputText);
        await processProduceListing(produceData);
        break;
        
      default:
        console.log("❌ Invalid choice. Please run again.");
        break;
    }
    
  } catch (err) {
    console.error("❌ Agent Error:", err.message);
  } finally {
    rl.close();
    // Close Firebase connection
    await admin.app().delete();
  }
}

module.exports = { 
  runAgent, 
  addTestData, 
  addTestFirebaseData,
  processProduceListing,
  listenToFirebaseChanges,
  getProduceFromFirebase 
};

if (require.main === module) {
  runAgent();
}