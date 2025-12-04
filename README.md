# CareerCoachAI FHE

A privacy-preserving AI career coaching platform that lets users interact with a personalized assistant while keeping conversation content encrypted end-to-end. The system uses fully homomorphic encryption (FHE) to analyze encrypted user inputs and produce encrypted recommendations, so sensitive career information never needs to be exposed to cloud services or third-party operators.

## Why this exists

Modern career coaching relies on personal disclosures — work history, mental blocks, career goals, performance feedback — all of which are sensitive. People hesitate to use online coaching when they are uncertain about who can read their conversations or how data will be reused.

The platform is designed to remove that barrier by enabling meaningful AI-driven guidance without revealing raw user data. FHE is central: it allows computations (including natural language processing steps) to run directly on encrypted inputs, producing useful encrypted outputs that can be decrypted only by the user or by authorized parties under explicit conditions.

## Key Concepts: FHE in context

* **Computation on ciphertexts**: FHE enables the server to perform analysis and model inference on encrypted messages. The server never holds plaintext user conversations.
* **Minimal trust model**: Cloud infrastructure and model operators do not obtain access to raw data, reducing regulatory and reputational risks.
* **Selective reveal**: Users control when and what to decrypt; aggregate analytics can be produced without exposing individual records.

This project leverages these properties to provide confidential, personalized coaching at scale.

## What it solves

* **Privacy leakage in conversational AI**: User transcripts and prompts are not stored or processed in plaintext on remote servers.
* **Data residency and compliance friction**: Encrypted computation reduces the burden of moving or anonymizing data across jurisdictions.
* **Institutional adoption barriers**: Employers and educational institutions can offer coaching services without inheriting sensitive employee/student data.
* **Trust and uptake**: Users are more likely to engage honestly when they know their words cannot be inspected by operators.

## Features

### Core Capabilities

* **Encrypted conversational sessions**: Users send encrypted messages; the assistant processes them using FHE-enabled models and returns encrypted responses.
* **Personalized advice**: Career trajectory suggestions, resume refinement tips, interview practice prompts, and upskilling roadmaps tailored from encrypted inputs.
* **Private session history**: Encrypted logs that users can decrypt locally; no plaintext transcripts are stored in the cloud.
* **On-device decryption control**: Only the user's device (or an authorized key holder) can decrypt responses.

### Practical Utilities

* **Mock interview engine**: Encrypted role-play with AI followed by encrypted feedback scoring.
* **Trajectory planner**: Encrypted evaluation of user skills against target roles with suggested learning goals.
* **Confidential note-taking**: Store encrypted reflections and milestones for self-review.

### Analytics without exposure

* **Aggregate trends**: Compute anonymized, encrypted metrics about skills demand or trending concerns across users without decrypting individuals.
* **Alerting**: Encrypted threshold checks (e.g., many users reporting the same barrier) that trigger privileged, privacy-aware responses.

## How it works (high level)

1. **Client-side encryption**: The user's device encrypts messages and local state with FHE-compatible keys before upload.
2. **Encrypted model inference**: Cloud services run FHE-capable inference modules that accept ciphertexts and emit ciphertext results.
3. **Encrypted post-processing**: Aggregation, scoring, and rule-based operations are performed on ciphertexts where feasible.
4. **Decryption**: Ciphertext outputs are returned to the client. The client decrypts locally and presents human-readable guidance.

Certain heavy-weight model components may operate through hybrid techniques — mixing secure enclaves or split-compute with FHE — to balance utility, latency, and cost. Wherever possible, computation remains homomorphic to protect privacy.

## Architecture

### Client

* Handles key generation and local key storage.
* Performs client-side encryption of messages and personal profile data.
* Decrypts returned ciphertexts and renders UI.
* Manages permissioned sharing of decrypted artifacts if the user opts in.

### Encrypted Compute Layer

* Accepts encrypted conversational inputs and metadata.
* Runs FHE-compatible inference paths for NLP tasks (intent detection, summarization, scoring).
* Produces encrypted suggestions, clarifications, and structured outputs.

### Orchestration & Storage

* Stores ciphertexts and ciphertext-based indexes on behalf of users.
* Maintains immutable logs of encrypted interactions for reproducibility and auditing.
* Coordinates FHE computation tasks and queues using serverless or containerized workers.

### Access & Key Management

* Keys are generated and primarily held client-side.
* Optional key recovery or guardian mechanisms are available under user control.
* Fine-grained access policies govern any delegated decryption.

## Privacy and Security

* **End-to-end confidentiality**: Plaintext content never transits or resides on servers under normal operation.
* **Proofs and integrity**: Computation outputs can be accompanied by verifiable proofs when supported by the FHE backend.
* **Least privilege**: Decryption keys remain with users unless they explicitly delegate access.
* **Immutable encrypted audit trails**: System logs remain useful for debugging and compliance without exposing inputs.

## Usage

* **Onboarding**: User generates an encryption keypair locally and completes a brief guided calibration (optional).
* **Start a session**: Compose a question or upload context; encryption happens automatically on the client.
* **Receive guidance**: The server returns encrypted model outputs; client decrypts and displays advice.
* **Iterate privately**: Continued back-and-forth occurs without revealing plaintext to the server.

## Developer Notes

* Components that perform token-level transformations must be adapted to FHE-compatible primitives; not all NLP ops map directly to homomorphic operations.
* Hybrid approaches are pragmatic: use FHE for sensitive scoring and small models; use secure enclaves or federated techniques for larger, non-sensitive backbones when needed.
* Performance and cost considerations are significant: batching, quantization, and domain-specific model pruning help reduce overhead.

## Deployment Considerations

* **Compute footprint**: Plan for higher CPU/memory usage for FHE workloads compared to plaintext inference.
* **Latency trade-offs**: Expect increased latency; user experience design can mitigate perceived delay with progressive, local hints.
* **Key lifecycle**: Design clear recovery and revocation flows with strong user consent and auditing.
* **Compliance posture**: FHE reduces exposure, but organizational policies must still account for metadata and operational logs.

## Roadmap

* Expand FHE model library for richer NLP tasks (dialogue state, intent hooking, recommendation ranking).
* Add collaborative coaching scenarios where organizations can sponsor anonymized, aggregated programs.
* Lower latency through optimized FHE schemes and model distillation tuned for homomorphic evaluation.
* Build UX patterns that communicate privacy guarantees clearly to end users.

## Frequently Asked Questions

**Q: Will the server ever see my raw messages?**
A: Under normal operation, no. Only ciphertext is sent and processed on the server.

**Q: Can I share decrypted transcripts with a coach or employer?**
A: Yes — sharing is a user-controlled action. Any delegation requires explicit key sharing or a recovery mechanism.

**Q: Is FHE perfect for all NLP tasks today?**
A: FHE is powerful but has limits. Some complex transforms are costly; hybrid designs are often used to balance practicality and privacy.

## Contribution & Governance

* The design encourages community-driven improvements to privacy primitives and model patterns.
* Contributions should focus on modular FHE tooling, efficient homomorphic operators for text, and privacy-preserving UX.

## License

This work is released under a permissive license intended to encourage research and safe deployment.

Thank you for exploring a privacy-first approach to career coaching powered by encrypted computation.
