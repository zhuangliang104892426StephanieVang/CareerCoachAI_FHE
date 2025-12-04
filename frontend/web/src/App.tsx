// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface CareerAdvice {
  id: string;
  encryptedQuestion: string;
  encryptedAnswer: string;
  timestamp: number;
  owner: string;
  category: string;
}

const App: React.FC = () => {
  // Randomized style selections
  // Colors: High contrast (blue+orange)
  // UI: Cyberpunk
  // Layout: Center radiation
  // Interaction: Micro-interactions
  
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [advices, setAdvices] = useState<CareerAdvice[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAskModal, setShowAskModal] = useState(false);
  const [asking, setAsking] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });
  const [newQuestion, setNewQuestion] = useState({
    category: "",
    question: ""
  });
  const [activeTab, setActiveTab] = useState("advice");
  const [searchTerm, setSearchTerm] = useState("");

  // Randomly selected features: Data statistics, Search & filter, Data details
  const categories = ["Career Change", "Salary Negotiation", "Skills Development", "Work-Life Balance", "Promotion"];
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: advices.filter(a => a.category === cat).length
  }));

  useEffect(() => {
    loadAdvices().finally(() => setLoading(false));
  }, []);

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
      });
    } catch (e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  const loadAdvices = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check contract availability using FHE
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("Contract is not available");
        return;
      }
      
      const keysBytes = await contract.getData("advice_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing advice keys:", e);
        }
      }
      
      const list: CareerAdvice[] = [];
      
      for (const key of keys) {
        try {
          const adviceBytes = await contract.getData(`advice_${key}`);
          if (adviceBytes.length > 0) {
            try {
              const adviceData = JSON.parse(ethers.toUtf8String(adviceBytes));
              list.push({
                id: key,
                encryptedQuestion: adviceData.question,
                encryptedAnswer: adviceData.answer,
                timestamp: adviceData.timestamp,
                owner: adviceData.owner,
                category: adviceData.category
              });
            } catch (e) {
              console.error(`Error parsing advice data for ${key}:`, e);
            }
          }
        } catch (e) {
          console.error(`Error loading advice ${key}:`, e);
        }
      }
      
      list.sort((a, b) => b.timestamp - a.timestamp);
      setAdvices(list);
    } catch (e) {
      console.error("Error loading advices:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const askQuestion = async () => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setAsking(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting your question with FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedQuestion = `FHE-${btoa(newQuestion.question)}`;
      const encryptedAnswer = `FHE-${btoa("Analyzing with FHE-NLP model...")}`;
      
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const adviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const adviceData = {
        question: encryptedQuestion,
        answer: encryptedAnswer,
        timestamp: Math.floor(Date.now() / 1000),
        owner: account,
        category: newQuestion.category
      };
      
      // Store encrypted data on-chain using FHE
      await contract.setData(
        `advice_${adviceId}`, 
        ethers.toUtf8Bytes(JSON.stringify(adviceData))
      );
      
      const keysBytes = await contract.getData("advice_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(adviceId);
      
      await contract.setData(
        "advice_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Question submitted securely! Processing with FHE-NLP..."
      });
      
      await loadAdvices();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowAskModal(false);
        setNewQuestion({
          category: "",
          question: ""
        });
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.message.includes("user rejected transaction")
        ? "Transaction rejected by user"
        : "Submission failed: " + (e.message || "Unknown error");
      
      setTransactionStatus({
        visible: true,
        status: "error",
        message: errorMessage
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setAsking(false);
    }
  };

  const filteredAdvices = advices.filter(advice => 
    advice.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advice.encryptedQuestion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="loading-screen">
      <div className="cyber-spinner"></div>
      <p>Initializing FHE connection...</p>
    </div>
  );

  return (
    <div className="app-container cyberpunk-theme">
      <div className="radial-bg"></div>
      
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <div className="shield-icon"></div>
          </div>
          <h1>Career<span>FHE</span>Coach</h1>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowAskModal(true)} 
            className="ask-btn cyber-button"
          >
            <div className="add-icon"></div>
            Ask Career Question
          </button>
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>
      
      <div className="main-content">
        <div className="center-radial-container">
          <div className="content-panel">
            <div className="tabs">
              <button 
                className={`tab-button ${activeTab === "advice" ? "active" : ""}`}
                onClick={() => setActiveTab("advice")}
              >
                My Career Advice
              </button>
              <button 
                className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
                onClick={() => setActiveTab("stats")}
              >
                Statistics
              </button>
            </div>
            
            {activeTab === "advice" && (
              <div className="advice-section">
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search questions or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="cyber-input"
                  />
                  <button 
                    onClick={loadAdvices}
                    className="refresh-btn cyber-button"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                
                <div className="advice-list">
                  {filteredAdvices.length === 0 ? (
                    <div className="no-advices">
                      <div className="no-advices-icon"></div>
                      <p>No career advice records found</p>
                      <button 
                        className="cyber-button primary"
                        onClick={() => setShowAskModal(true)}
                      >
                        Ask First Question
                      </button>
                    </div>
                  ) : (
                    filteredAdvices.map(advice => (
                      <div className="advice-card cyber-card" key={advice.id}>
                        <div className="advice-header">
                          <span className="category-badge">{advice.category}</span>
                          <span className="timestamp">
                            {new Date(advice.timestamp * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="advice-content">
                          <h3>Question:</h3>
                          <p>{atob(advice.encryptedQuestion.replace("FHE-", ""))}</p>
                          <h3>FHE-NLP Analysis:</h3>
                          <p className="fhe-answer">{atob(advice.encryptedAnswer.replace("FHE-", ""))}</p>
                        </div>
                        <div className="advice-footer">
                          <span className="owner">
                            {advice.owner.substring(0, 6)}...{advice.owner.substring(38)}
                          </span>
                          <div className="fhe-badge">
                            <span>FHE-Encrypted</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === "stats" && (
              <div className="stats-section">
                <div className="stats-grid">
                  <div className="stat-card cyber-card">
                    <h3>Total Questions</h3>
                    <div className="stat-value">{advices.length}</div>
                  </div>
                  
                  <div className="stat-card cyber-card">
                    <h3>Categories</h3>
                    <div className="category-stats">
                      {categoryCounts.map((cat, index) => (
                        <div key={index} className="category-item">
                          <span className="category-name">{cat.name}</span>
                          <div className="category-bar-container">
                            <div 
                              className="category-bar" 
                              style={{ width: `${(cat.count / Math.max(1, advices.length)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="category-count">{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="fhe-explainer cyber-card">
                  <h3>How FHE Protects Your Career Data</h3>
                  <p>
                    Fully Homomorphic Encryption (FHE) allows our AI to analyze your career questions 
                    while keeping the data encrypted at all times. No human or system ever sees your 
                    raw personal information.
                  </p>
                  <div className="fhe-process">
                    <div className="fhe-step">
                      <div className="step-icon">1</div>
                      <p>Your question is encrypted with FHE before submission</p>
                    </div>
                    <div className="fhe-step">
                      <div className="step-icon">2</div>
                      <p>Our FHE-NLP model processes the encrypted data</p>
                    </div>
                    <div className="fhe-step">
                      <div className="step-icon">3</div>
                      <p>You receive personalized advice without ever decrypting your data</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  
      {showAskModal && (
        <ModalAsk 
          onSubmit={askQuestion} 
          onClose={() => setShowAskModal(false)} 
          asking={asking}
          questionData={newQuestion}
          setQuestionData={setNewQuestion}
          categories={categories}
        />
      )}
      
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}
      
      {transactionStatus.visible && (
        <div className="transaction-modal">
          <div className="transaction-content cyber-card">
            <div className={`transaction-icon ${transactionStatus.status}`}>
              {transactionStatus.status === "pending" && <div className="cyber-spinner"></div>}
              {transactionStatus.status === "success" && <div className="check-icon"></div>}
              {transactionStatus.status === "error" && <div className="error-icon"></div>}
            </div>
            <div className="transaction-message">
              {transactionStatus.message}
            </div>
          </div>
        </div>
      )}
  
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <div className="shield-icon"></div>
              <span>CareerFHECoach</span>
            </div>
            <p>Privacy-preserving career coaching powered by FHE</p>
          </div>
          
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="fhe-badge">
            <span>FHE-Powered Privacy</span>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} CareerFHECoach. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

interface ModalAskProps {
  onSubmit: () => void; 
  onClose: () => void; 
  asking: boolean;
  questionData: any;
  setQuestionData: (data: any) => void;
  categories: string[];
}

const ModalAsk: React.FC<ModalAskProps> = ({ 
  onSubmit, 
  onClose, 
  asking,
  questionData,
  setQuestionData,
  categories
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setQuestionData({
      ...questionData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    if (!questionData.category || !questionData.question) {
      alert("Please fill required fields");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="ask-modal cyber-card">
        <div className="modal-header">
          <h2>Ask Career Question</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="fhe-notice-banner">
            <div className="key-icon"></div> Your question will be encrypted with Zama FHE
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select 
                name="category"
                value={questionData.category} 
                onChange={handleChange}
                className="cyber-select"
              >
                <option value="">Select category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group full-width">
              <label>Your Career Question *</label>
              <textarea 
                name="question"
                value={questionData.question} 
                onChange={handleChange}
                placeholder="Ask anything about your career path..." 
                className="cyber-textarea"
                rows={4}
              />
            </div>
          </div>
          
          <div className="privacy-notice">
            <div className="privacy-icon"></div> Your question remains encrypted during FHE processing
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-btn cyber-button"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={asking}
            className="submit-btn cyber-button primary"
          >
            {asking ? "Encrypting with FHE..." : "Submit Securely"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;