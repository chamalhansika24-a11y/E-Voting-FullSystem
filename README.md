# Distributed E-Voting System using Microservices & Blockchain

A secure, decentralized, and transparent E-Voting System designed using Microservices Architecture, Passwordless Biometric Authentication (WebAuthn), and Ethereum Blockchain for immutable vote recording.

---

## 📌 Features

- **Decentralized Architecture**: Built with 3 independent microservices to prevent single points of failure.
- **Biometric Security**: Passwordless authentication using **WebAuthn** (Fingerprint / FaceID / TouchID).
- **Immutable Vote Logging**: Votes are recorded permanently on the **Ethereum Blockchain** via Smart Contracts.
- **Double-Voting Prevention**: Strict on-chain state verification to reject duplicate votes.
- **Real-Time Public Analytics**: Independent results engine fetching live vote counts directly from the Smart Contract without intermediate service dependencies.
- **Automated DevSecOps Pipeline**: Integrated **CI/CD Pipelines** using **GitHub Actions** and **Jenkins**.

---

## 🏗️ System Architecture & Microservices Breakdown

The system is containerized using **Docker** and orchestrated via **Docker Compose**:

1. **Microservice 1 (MS1) - User Auth & Admin Service**
   - **Tech Stack**: Node.js (v20), Express.js, MongoDB (Mongoose), Nodemailer, Tailwind CSS.
   - **Role**: Manages election setup, batch voter onboarding via CSV upload, WebAuthn biometric registration/login, and issues cryptographically signed JWT tokens.

2. **Microservice 2 (MS2) - Voting Core Engine**
   - **Tech Stack**: Python (FastAPI/Flask), Web3.py, Solidity, Ganache.
   - **Role**: Validates JWT tokens, executes Solidity Smart Contracts (`Voting.sol`), logs votes onto the Ethereum Blockchain, and enforces double-voting checks.

3. **Microservice 3 (MS3) - Real-Time Results Engine**
   - **Tech Stack**: Node.js, Express.js, Web3.js / Ethers.js.
   - **Role**: Directly reads vote tallies from the Blockchain Smart Contract in real-time, bypassing MS1 & MS2 for uninterrupted transparency.

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) & Docker Compose
- [Ganache](https://trufflesuite.com/ganache/) (Local Ethereum Blockchain)
- Node.js (v20+) & Python (v3.10+)

## 📄 Presentation & Documentation

- 📊 **Presentation Slides**: [E-Voting Presentation (PDF)](./e-vote-presentation-final.pdf)

### Running the System with Docker

