// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract CareerCoachAIFHE is SepoliaConfig {
    struct EncryptedSession {
        uint256 id;
        euint32 encryptedPrompt;     // Encrypted user message
        euint32 encryptedResponse;   // Encrypted AI feedback
        euint32 encryptedTopic;      // Encrypted conversation topic
        uint256 timestamp;
        address user;
    }

    struct DecryptedSession {
        string prompt;
        string response;
        string topic;
        bool isDecrypted;
    }

    uint256 public sessionCount;
    mapping(uint256 => EncryptedSession) public encryptedSessions;
    mapping(uint256 => DecryptedSession) public decryptedSessions;

    mapping(address => uint256[]) private userSessions;
    mapping(string => euint32) private encryptedTopicUsage;
    string[] private topicList;

    mapping(uint256 => uint256) private requestToSessionId;

    event SessionSubmitted(uint256 indexed id, address indexed user, uint256 timestamp);
    event DecryptionRequested(uint256 indexed id);
    event SessionDecrypted(uint256 indexed id);
    event TopicUsageUpdated(string indexed topic);

    modifier onlySessionOwner(uint256 sessionId) {
        require(encryptedSessions[sessionId].user == msg.sender, "Unauthorized user");
        _;
    }

    /// @notice Submit an encrypted conversation session
    function submitEncryptedSession(
        euint32 encryptedPrompt,
        euint32 encryptedResponse,
        euint32 encryptedTopic
    ) public {
        sessionCount += 1;
        uint256 newId = sessionCount;

        encryptedSessions[newId] = EncryptedSession({
            id: newId,
            encryptedPrompt: encryptedPrompt,
            encryptedResponse: encryptedResponse,
            encryptedTopic: encryptedTopic,
            timestamp: block.timestamp,
            user: msg.sender
        });

        decryptedSessions[newId] = DecryptedSession({
            prompt: "",
            response: "",
            topic: "",
            isDecrypted: false
        });

        userSessions[msg.sender].push(newId);

        emit SessionSubmitted(newId, msg.sender, block.timestamp);
    }

    /// @notice Request decryption of a specific session
    function requestSessionDecryption(uint256 sessionId) public onlySessionOwner(sessionId) {
        EncryptedSession storage s = encryptedSessions[sessionId];
        require(!decryptedSessions[sessionId].isDecrypted, "Already decrypted");

        bytes32 ;
        ciphertexts[0] = FHE.toBytes32(s.encryptedPrompt);
        ciphertexts[1] = FHE.toBytes32(s.encryptedResponse);
        ciphertexts[2] = FHE.toBytes32(s.encryptedTopic);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptSession.selector);
        requestToSessionId[reqId] = sessionId;

        emit DecryptionRequested(sessionId);
    }

    /// @notice Callback for decrypted session data
    function decryptSession(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 sessionId = requestToSessionId[requestId];
        require(sessionId != 0, "Invalid request");

        EncryptedSession storage eSession = encryptedSessions[sessionId];
        DecryptedSession storage dSession = decryptedSessions[sessionId];
        require(!dSession.isDecrypted, "Already decrypted");

        FHE.checkSignatures(requestId, cleartexts, proof);

        string[] memory results = abi.decode(cleartexts, (string[]));

        dSession.prompt = results[0];
        dSession.response = results[1];
        dSession.topic = results[2];
        dSession.isDecrypted = true;

        _updateTopicUsage(dSession.topic);

        emit SessionDecrypted(sessionId);
    }

    /// @notice Get decrypted session details
    function getDecryptedSession(uint256 sessionId)
        public
        view
        returns (string memory prompt, string memory response, string memory topic, bool isDecrypted)
    {
        DecryptedSession storage s = decryptedSessions[sessionId];
        return (s.prompt, s.response, s.topic, s.isDecrypted);
    }

    /// @notice Get encrypted usage count for a given topic
    function getEncryptedTopicUsage(string memory topic) public view returns (euint32) {
        return encryptedTopicUsage[topic];
    }

    /// @notice Request to decrypt total usage of a topic
    function requestTopicUsageDecryption(string memory topic) public {
        euint32 usage = encryptedTopicUsage[topic];
        require(FHE.isInitialized(usage), "Topic not found");

        bytes32 ;
        ciphertexts[0] = FHE.toBytes32(usage);

        uint256 reqId = FHE.requestDecryption(ciphertexts, this.decryptTopicUsage.selector);
        requestToSessionId[reqId] = bytes32ToUint(keccak256(abi.encodePacked(topic)));
    }

    /// @notice Callback for decrypted topic usage
    function decryptTopicUsage(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory proof
    ) public {
        uint256 topicHash = requestToSessionId[requestId];
        string memory topic = getTopicFromHash(topicHash);

        FHE.checkSignatures(requestId, cleartexts, proof);

        uint32 count = abi.decode(cleartexts, (uint32));
        // Handle decrypted count (e.g., emit an event or use internally)
    }

    /// @notice Retrieve all session IDs for a user
    function getUserSessions(address user) public view returns (uint256[] memory) {
        return userSessions[user];
    }

    /// @dev Internal helper to update encrypted topic usage
    function _updateTopicUsage(string memory topic) internal {
        if (FHE.isInitialized(encryptedTopicUsage[topic]) == false) {
            encryptedTopicUsage[topic] = FHE.asEuint32(0);
            topicList.push(topic);
        }

        encryptedTopicUsage[topic] = FHE.add(encryptedTopicUsage[topic], FHE.asEuint32(1));
        emit TopicUsageUpdated(topic);
    }

    /// @dev Convert bytes32 to uint256
    function bytes32ToUint(bytes32 b) private pure returns (uint256) {
        return uint256(b);
    }

    /// @dev Retrieve topic string by its hash
    function getTopicFromHash(uint256 hash) private view returns (string memory) {
        for (uint i = 0; i < topicList.length; i++) {
            if (bytes32ToUint(keccak256(abi.encodePacked(topicList[i]))) == hash) {
                return topicList[i];
            }
        }
        revert("Topic not found");
    }
}
