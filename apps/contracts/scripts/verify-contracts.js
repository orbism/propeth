#!/usr/bin/env node

/**
 * Etherscan V2 verification script
 *
 * Uses forge to generate standard-json-input, then POSTs directly to Etherscan V2 API.
 * For proxy contracts, reads implementation addresses from broadcast files.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

/* -------------------------------------------------------------------------- */
/* ENV                                                                        */
/* -------------------------------------------------------------------------- */

// Load .env from contracts directory
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_KEY || process.env.ETHERSCAN_API_KEY;

if (!ETHERSCAN_API_KEY) {
  console.error("Missing ETHERSCAN_KEY in apps/contracts/.env");
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const CHAIN_IDS = {
  sepolia: 11155111,
  mainnet: 1
};

const BROADCAST_SCRIPTS = {
  sepolia: "DeployUpgradeableSepolia.s.sol",
  mainnet: "DeployUpgradeableMainnet.s.sol"
};

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";

const CONTRACTS = [
  { name: "MockRandomness", path: "src/mocks/MockRandomness.sol:MockRandomness" },
  { name: "Pack1155Upgradeable", path: "src/Pack1155Upgradeable.sol:Pack1155Upgradeable" },
  { name: "Fortune721Upgradeable", path: "src/Fortune721Upgradeable.sol:Fortune721Upgradeable" },
  { name: "BurnRedeemGateway", path: "src/BurnRedeemGateway.sol:BurnRedeemGateway" },
  { name: "DirectBurn1155", path: "src/adapters/DirectBurn1155.sol:DirectBurn1155" },
];

// Proxy contracts: each impl name maps to the ERC1967Proxy deployed after it
const PROXY_IMPL_NAMES = ["Pack1155Upgradeable", "Fortune721Upgradeable"];

/* -------------------------------------------------------------------------- */
/* HTTP                                                                       */
/* -------------------------------------------------------------------------- */

function post(url, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const u = new URL(url);

    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(data));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(data));
          }
        });
      })
      .on("error", reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/* BROADCAST HELPERS                                                          */
/* -------------------------------------------------------------------------- */

function loadBroadcast(chain) {
  const chainId = CHAIN_IDS[chain];
  const script = BROADCAST_SCRIPTS[chain];

  if (!chainId || !script) {
    console.error(`Unknown chain: ${chain}`);
    return null;
  }

  const broadcastPath = path.join(__dirname, "..", "broadcast", script, String(chainId), "run-latest.json");

  if (!fs.existsSync(broadcastPath)) {
    console.error(`Broadcast file not found: ${broadcastPath}`);
    return null;
  }

  return JSON.parse(fs.readFileSync(broadcastPath, "utf8"));
}

function getAddressFromBroadcast(broadcast, contractName) {
  // Find the first CREATE transaction for this contract name
  const tx = broadcast.transactions.find(
    t => t.contractName === contractName && t.transactionType === "CREATE"
  );
  return tx?.contractAddress;
}

function extractConstructorArgs(tx) {
  if (!tx) return "";
  const contractName = tx.contractName;
  const contractFile = contractName + ".sol";
  const outPath = path.join(__dirname, "..", "out", contractFile, `${contractName}.json`);
  if (!fs.existsSync(outPath)) return "";

  const output = JSON.parse(fs.readFileSync(outPath, "utf8"));
  const creationBytecode = output.bytecode?.object;
  const input = tx.transaction?.input || tx.transaction?.data;
  if (!creationBytecode || !input) return "";

  const bytecodeHex = creationBytecode.replace(/^0x/, "");
  const inputHex = input.replace(/^0x/, "");
  if (inputHex.startsWith(bytecodeHex)) {
    return inputHex.slice(bytecodeHex.length);
  }
  return "";
}

function getConstructorArgsFromBroadcast(broadcast, contractName) {
  const tx = broadcast.transactions.find(
    t => t.contractName === contractName && t.transactionType === "CREATE"
  );
  return extractConstructorArgs(tx);
}

function getProxiesFromBroadcast(broadcast) {
  // Walk transactions in order. After each impl CREATE, the next ERC1967Proxy CREATE is its proxy.
  const proxies = [];
  const txs = broadcast.transactions;
  for (let i = 0; i < txs.length; i++) {
    const t = txs[i];
    if (t.transactionType === "CREATE" && PROXY_IMPL_NAMES.includes(t.contractName)) {
      // Find the next ERC1967Proxy CREATE after this index
      for (let j = i + 1; j < txs.length; j++) {
        if (txs[j].transactionType === "CREATE" && txs[j].contractName === "ERC1967Proxy") {
          proxies.push({
            name: `${t.contractName} Proxy`,
            proxyAddress: txs[j].contractAddress,
            implAddress: t.contractAddress,
            contractPath: "lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
            proxyTx: txs[j],
          });
          break;
        }
      }
    }
  }
  return proxies;
}

/* -------------------------------------------------------------------------- */
/* FORGE HELPERS                                                              */
/* -------------------------------------------------------------------------- */

function getStandardJsonInput(address, contractPath) {
  try {
    const result = execSync(
      `forge verify-contract ${address} ${contractPath} --show-standard-json-input`,
      { cwd: path.join(__dirname, ".."), encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
    );
    return result;
  } catch (error) {
    console.error("Failed to get standard JSON input:", error.message);
    return null;
  }
}

function getCompilerVersion(contractName) {
  const outPath = path.join(__dirname, "..", "out", `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(outPath)) {
    console.error(`Contract output not found: ${outPath}`);
    return null;
  }

  const output = JSON.parse(fs.readFileSync(outPath, "utf8"));
  const rawMetadata = output.rawMetadata ? JSON.parse(output.rawMetadata) : output.metadata;

  if (rawMetadata?.compiler?.version) {
    return `v${rawMetadata.compiler.version}`;
  }

  // Fallback
  return "v0.8.26+commit.8a97fa7a";
}

/* -------------------------------------------------------------------------- */
/* VERIFY                                                                     */
/* -------------------------------------------------------------------------- */

async function verify(address, contractName, contractPath, chainId, constructorArgs) {
  console.log(`\nVerifying ${contractName} @ ${address}`);

  const standardJson = getStandardJsonInput(address, contractPath);
  if (!standardJson) {
    console.error(`Failed to get standard JSON for ${contractName}`);
    return false;
  }

  const compilerVersion = getCompilerVersion(contractName);
  console.log(`Compiler: ${compilerVersion}`);
  if (constructorArgs) console.log(`Constructor args: ${constructorArgs.slice(0, 40)}...`);

  const submit = await post(`${ETHERSCAN_V2}?chainid=${chainId}`, {
    module: "contract",
    action: "verifysourcecode",
    apikey: ETHERSCAN_API_KEY,
    contractaddress: address,
    sourceCode: standardJson,
    codeformat: "solidity-standard-json-input",
    contractname: contractPath,
    compilerversion: compilerVersion,
    constructorArguements: constructorArgs || "",
  });

  if (submit.status !== "1") {
    console.error("Submission failed:", submit.result);
    return false;
  }

  const guid = submit.result;
  console.log("Submitted, GUID:", guid);

  for (let i = 0; i < 10; i++) {
    await sleep(3000);
    const status = await get(
      `${ETHERSCAN_V2}?chainid=${chainId}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${ETHERSCAN_API_KEY}`
    );

    if (status.result === "Pending in queue") {
      console.log("Pending...");
      continue;
    }

    if (status.status === "1") {
      console.log("✔ Verified");
      return true;
    }

    console.error("Verification failed:", status.result);
    return false;
  }

  console.error("Timed out");
  return false;
}

async function verifyProxy(proxyAddress, implAddress, name, chainId) {
  console.log(`\nMarking proxy ${name} @ ${proxyAddress} -> impl ${implAddress}`);

  const submit = await post(`${ETHERSCAN_V2}?chainid=${chainId}`, {
    module: "contract",
    action: "verifyproxycontract",
    apikey: ETHERSCAN_API_KEY,
    address: proxyAddress,
    expectedimplementation: implAddress,
  });

  if (submit.status !== "1") {
    console.error("Proxy verification submission failed:", submit.result);
    return false;
  }

  const guid = submit.result;
  console.log("Submitted proxy verification, GUID:", guid);

  for (let i = 0; i < 10; i++) {
    await sleep(3000);
    const status = await get(
      `${ETHERSCAN_V2}?chainid=${chainId}&module=contract&action=checkproxyverification&guid=${guid}&apikey=${ETHERSCAN_API_KEY}`
    );

    if (status.result === "Pending in queue") {
      console.log("Pending...");
      continue;
    }

    if (status.status === "1") {
      console.log("✔ Proxy verified");
      return true;
    }

    console.error("Proxy verification failed:", status.result);
    return false;
  }

  console.error("Timed out");
  return false;
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { chain: "sepolia", contract: null, address: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--chain" && args[i + 1]) {
      config.chain = args[i + 1];
      i++;
    } else if (args[i] === "--contract" && args[i + 1]) {
      config.contract = args[i + 1];
      i++;
    } else if (args[i] === "--address" && args[i + 1]) {
      config.address = args[i + 1].toLowerCase();
      i++;
    }
  }

  return config;
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                       */
/* -------------------------------------------------------------------------- */

(async () => {
  const config = parseArgs();
  const chainId = CHAIN_IDS[config.chain];

  if (!chainId) {
    console.error(`Unknown chain: ${config.chain}`);
    process.exit(1);
  }

  console.log(`\n=== Etherscan V2 Verification ===`);
  console.log(`Chain: ${config.chain} (${chainId})`);

  // Load broadcast to get implementation addresses
  const broadcast = loadBroadcast(config.chain);
  if (!broadcast) {
    console.error("Failed to load broadcast file");
    process.exit(1);
  }

  // Resolve proxies from broadcast
  const allProxies = getProxiesFromBroadcast(broadcast);

  // Filter by --contract name or --address
  let contracts, proxies;
  let addressOverride = null; // when --address + --contract, use this address instead of broadcast
  if (config.address && config.contract) {
    // Verify a specific contract name at an arbitrary address (e.g. manually deployed impl)
    contracts = CONTRACTS.filter(c => c.name.toLowerCase() === config.contract.toLowerCase());
    proxies = [];
    if (contracts.length === 0) {
      console.error(`Unknown contract: ${config.contract}`);
      console.error(`Available: ${CONTRACTS.map(c => c.name).join(", ")}`);
      process.exit(1);
    }
    addressOverride = config.address;
  } else if (config.address) {
    // Match address against implementation contracts
    contracts = CONTRACTS.filter(c => {
      const addr = getAddressFromBroadcast(broadcast, c.name);
      return addr && addr.toLowerCase() === config.address;
    });
    // Match address against proxy addresses
    proxies = allProxies.filter(p => p.proxyAddress.toLowerCase() === config.address);
    if (contracts.length === 0 && proxies.length === 0) {
      console.error(`Address ${config.address} not found in broadcast.`);
      console.error("Known addresses:");
      for (const c of CONTRACTS) {
        const addr = getAddressFromBroadcast(broadcast, c.name);
        if (addr) console.error(`  ${c.name}: ${addr}`);
      }
      for (const p of allProxies) {
        console.error(`  ${p.name}: ${p.proxyAddress}`);
      }
      console.error("\nTip: use --address <addr> --contract <name> to verify an address not in the broadcast.");
      process.exit(1);
    }
  } else if (config.contract) {
    contracts = CONTRACTS.filter(c => c.name.toLowerCase() === config.contract.toLowerCase());
    proxies = allProxies.filter(p => p.name.toLowerCase().startsWith(config.contract.toLowerCase()));
    if (contracts.length === 0 && proxies.length === 0) {
      console.error(`Unknown contract: ${config.contract}`);
      console.error(`Available: ${CONTRACTS.map(c => c.name).join(", ")}`);
      process.exit(1);
    }
  } else {
    contracts = CONTRACTS;
    proxies = allProxies;
  }

  console.log("\nTargets:");
  for (const c of contracts) {
    const addr = addressOverride || getAddressFromBroadcast(broadcast, c.name);
    console.log(`  ${c.name}: ${addr || "not found"}${addressOverride ? " (manual)" : ""}`);
  }
  for (const p of proxies) {
    console.log(`  ${p.name}: ${p.proxyAddress} -> ${p.implAddress}`);
  }

  let ok = 0;
  let fail = 0;

  // 1. Verify source code for implementation contracts
  for (const c of contracts) {
    const addr = addressOverride || getAddressFromBroadcast(broadcast, c.name);
    if (!addr) {
      console.log(`Skipping ${c.name}: address not found in broadcast`);
      continue;
    }

    const constructorArgs = addressOverride ? "" : getConstructorArgsFromBroadcast(broadcast, c.name);
    if (await verify(addr, c.name, c.path, chainId, constructorArgs)) ok++;
    else fail++;
  }

  // 2. Source-verify proxy contracts, then mark as proxies on Etherscan
  console.log("\n--- Proxy Verification ---");
  for (const p of proxies) {
    // Step 1: verify ERC1967Proxy source code
    const constructorArgs = extractConstructorArgs(p.proxyTx);
    await verify(p.proxyAddress, "ERC1967Proxy", p.contractPath, chainId, constructorArgs);

    // Step 2: mark as proxy (link to implementation)
    if (await verifyProxy(p.proxyAddress, p.implAddress, p.name, chainId)) ok++;
    else fail++;
  }

  console.log(`\n=== Results ===`);
  console.log(`Verified: ${ok}`);
  console.log(`Failed:   ${fail}`);
  process.exit(fail ? 1 : 0);
})();
