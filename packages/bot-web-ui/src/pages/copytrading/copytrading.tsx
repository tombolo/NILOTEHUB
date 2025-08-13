import React, { useState, useEffect } from 'react';
import styles from './CopyTradingPage.module.scss';

const CopyTradingDashboard: React.FC = () => {
    const [isDemoToReal, setIsDemoToReal] = useState(false);
    const [isCopyTrading, setIsCopyTrading] = useState(false);
    const [tokens, setTokens] = useState<string[]>([]);
    const [loginId, setLoginId] = useState('---');
    const [balance, setBalance] = useState('0.00 USD');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusMessage2, setStatusMessage2] = useState('');
    const [statusColor, setStatusColor] = useState('#4CAF50');
    const [statusColor2, setStatusColor2] = useState('#4CAF50');
    const [tokenInput, setTokenInput] = useState('');

    useEffect(() => {
        const storedTokens = JSON.parse(localStorage.getItem('copyTokensArray') || '[]');
        setTokens(storedTokens);

        const demoToReal = localStorage.getItem('demo_to_real') === 'true';
        setIsDemoToReal(demoToReal);

        const copyTrading = localStorage.getItem('iscopyTrading') === 'true';
        setIsCopyTrading(copyTrading);

        webSS();
    }, []);

    const showMessage = (message: string, isError = false, isPrimary = true) => {
        if (isPrimary) {
            setStatusMessage(message);
            setStatusColor(isError ? '#FF444F' : '#4CAF50');
        } else {
            setStatusMessage2(message);
            setStatusColor2(isError ? '#FF444F' : '#4CAF50');
        }

        setTimeout(() => {
            if (isPrimary) {
                setStatusMessage('');
            } else {
                setStatusMessage2('');
            }
        }, 2000);
    };

    const handleDemoToReal = () => {
        const newIsDemoToReal = !isDemoToReal;
        setIsDemoToReal(newIsDemoToReal);
        localStorage.setItem('demo_to_real', String(newIsDemoToReal));

        const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
        const keys = Object.keys(accountsList);

        if (newIsDemoToReal) {
            if (keys.length > 0 && !keys[0].startsWith("VR")) {
                const value = accountsList[keys[0]];
                const storedArray = JSON.parse(localStorage.getItem('copyTokensArray') || '[]');
                storedArray.push(value);
                localStorage.setItem('copyTokensArray', JSON.stringify(storedArray));
                setTokens(storedArray);

                showMessage("Demo to real set successfully");
            } else {
                showMessage("No real account found!", true);
                setIsDemoToReal(false);
                localStorage.setItem('demo_to_real', 'false');
            }
        } else {
            const keys = Object.keys(accountsList);
            const key = keys[0];
            const value = accountsList[key];
            let storedArray = JSON.parse(localStorage.getItem('copyTokensArray') || '[]');
            storedArray = storedArray.filter((token: string) => token !== value);
            localStorage.setItem('copyTokensArray', JSON.stringify(storedArray));
            setTokens(storedArray);

            showMessage("Stopped successfully", true);
        }
    };

    const handleCopyTrading = () => {
        const newIsCopyTrading = !isCopyTrading;
        setIsCopyTrading(newIsCopyTrading);
        localStorage.setItem('iscopyTrading', String(newIsCopyTrading));

        showMessage(
            newIsCopyTrading ? "Copy trading started successfully" : "Copy trading stopped successfully",
            !newIsCopyTrading,
            false
        );
    };

    const handleAddToken = () => {
        if (!tokenInput.trim()) return;

        const storedArray = JSON.parse(localStorage.getItem('copyTokensArray') || '[]');
        if (storedArray.includes(tokenInput)) {
            showMessage("Token already exists", true, false);
        } else {
            storedArray.push(tokenInput);
            localStorage.setItem('copyTokensArray', JSON.stringify(storedArray));
            setTokens(storedArray);
            setTokenInput('');
            showMessage("Token has been added", false, false);
        }
    };

    const handleDeleteToken = (index: number) => {
        const newTokens = [...tokens];
        newTokens.splice(index, 1);
        setTokens(newTokens);
        localStorage.setItem('copyTokensArray', JSON.stringify(newTokens));
        showMessage("Token removed!", false, false);
    };

    const webSS = () => {
        const APP_ID = localStorage.getItem('APP_ID');
        const accountsList = JSON.parse(localStorage.getItem('accountsList') || '{}');
        const keys = Object.keys(accountsList);
        const tokenz = keys.map(key => accountsList[key]);

        const ws1 = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`);

        ws1.addEventListener("open", () => {
            authorize(ws1, tokenz);
        });

        ws1.addEventListener("message", (event) => {
            const data = JSON.parse(event.data);
            const req = data.echo_req;
            const req_id = req.req_id;

            if (data.error) {
                console.log(data);
            } else {
                if (req_id === 2111) {
                    const account = data.authorize.account_list.find(
                        (acc: any) => acc.currency_type === 'fiat' && acc.is_virtual === 0
                    );
                    if (account) {
                        setLoginId(account.loginid);
                        getBalance(ws1, account.loginid);
                    }
                }

                if (req_id === 2112) {
                    const balance = data.balance.balance;
                    const currency = data.balance.currency;
                    setBalance(`${balance} ${currency}`);
                }
            }
        });
    };

    const authorize = (ws: WebSocket, tokens: string[]) => {
        const msg = JSON.stringify({
            authorize: 'MULTI',
            tokens,
            req_id: 2111
        });
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.send(msg);
        }
    };

    const getBalance = (ws: WebSocket, loginid: string) => {
        const msg = JSON.stringify({
            balance: 1,
            loginid,
            req_id: 2112
        });
        if (ws.readyState !== WebSocket.CLOSED) {
            ws.send(msg);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.backgroundEffect}></div>
            <div className={styles.container}>
                <div className={styles.topBar}>
                    <button
                        className={`${styles.btn} ${isDemoToReal ? styles.btnRed : styles.btnGreen}`}
                        onClick={handleDemoToReal}
                    >
                        {isDemoToReal ? 'Stop Demo to Real' : 'Start Demo to Real'}
                    </button>
                    <div className={styles.youtubeIcon}>
                        <img src="https://img.icons8.com/ios-filled/50/fa314a/youtube-play.png" alt="Tutorial" />
                        <div>Tutorial</div>
                    </div>
                </div>

                <div className={styles.replicatorToken}>
                    <span>
                        <h5>{loginId}</h5>
                        <p
                            className={`${styles.statusMsg} ${statusMessage ? styles.show : ''}`}
                            style={{ color: statusColor }}
                        >
                            {statusMessage}
                        </p>
                    </span>
                    <span style={{ color: '#FFD700' }}>{balance}</span>
                </div>

                <h5 className={styles.sectionTitle}>Add tokens to Replicator</h5>

                <div className={styles.card}>
                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            className={styles.formControl}
                            placeholder="Enter Client token"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                        />
                        <button
                            className={`${styles.btn} ${isCopyTrading ? styles.btnRed : styles.btnGreen}`}
                            onClick={handleCopyTrading}
                        >
                            {isCopyTrading ? 'Stop Copy Trading' : 'Start Copy Trading'}
                        </button>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button className={`${styles.btn} ${styles.btnCyan}`} onClick={handleAddToken}>
                            Add
                        </button>
                        <button className={`${styles.btn} ${styles.btnCyan}`} onClick={() => { }}>
                            Sync &#x21bb;
                        </button>
                        <img
                            src="https://img.icons8.com/ios-filled/24/fa314a/youtube-play.png"
                            alt="yt"
                            className={styles.youtubeSmall}
                        />
                    </div>
                    <p
                        className={`${styles.statusMsg} ${statusMessage2 ? styles.show : ''}`}
                        style={{ color: statusColor2 }}
                    >
                        {statusMessage2}
                    </p>
                </div>

                <div className={styles.card}>
                    <h6 className={styles.sectionSubtitle}>Total Clients added: {tokens.length}</h6>
                    <small className={styles.textMuted}>
                        {tokens.length === 0 ? 'No tokens added yet' : ''}
                    </small>
                    <div className={styles.tableContainer}>
                        <table className={styles.tokenTable}>
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokens.map((token, index) => (
                                    <tr key={index}>
                                        <td>{token}</td>
                                        <td>
                                            <span
                                                className={styles.deleteBtn}
                                                onClick={() => handleDeleteToken(index)}
                                            >
                                                X
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CopyTradingDashboard;