import { useEffect, useRef, useState } from 'react'
import { companyInfo } from './companyInfo';
import ChatForm from './ChatForm';
import ChatMessage from './ChatMessage';
import denni from './denni_logo.svg'
function RentalBot() {
  const [chatHistory, setChatHistory] = useState([{
    hideInChat: true,
    role: "model",
    text: companyInfo
  }]);
  const [showChatbot, setShowChatbot] = useState(false);

  const chatBodyRef = useRef();

  //HELPER FUNCTION TO UPDATE CHAT HISTORY
  const updateHistory = (text, isError = false) => {
    setChatHistory(prev => [...prev.filter(msg => msg.text !== "Thinking..."), {role: "model", text, isError}]);
  }
  const generateBotResponse = async (history) =>{
      //FORMAT CHAT HISTORY FOR API REQUEST
      history = history.map(({role, text}) => ({role, parts: [{ text }] }));

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({contents: history})
      };

      try{
        //API CALL FOR GETTING THE RESPONSE OF BOT
        const response = await fetch(import.meta.env.VITE_API_URL, requestOptions);
        const data = await response.json();
        
        //UPDATE CHAT HISTORY WITH BOT'S RESPONSE
        if(!response.ok) throw new Error(data.error.message || "Denni went Dizzy!");
      
          const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
          updateHistory(apiResponseText);

      }catch(error){
        updateHistory(error.message, true);
      }
  }

  useEffect(() => {
    //FOR AUTOSCROLLING
    chatBodyRef.current.scrollTo({top: chatBodyRef.current.scrollHeight, behavior: "smooth"});
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? 'show-chatbot' : ""}`}>
      <button onClick={() => setShowChatbot(prev => !prev)} id="chatbot-toggler">
        <span className="material-symbols-outlined"> mode_comment</span>
      </button>
      <div className="chatbot-popup">
        <div className="chat-header">
          <div className="header-info">
            <img src={denni} alt="icon" />
            <h2 className="logo-text">Denni</h2>
          </div>
          <button onClick={() => setShowChatbot(prev => !prev)} className="material-symbols-outlined"> keyboard_arrow_down</button>
        </div>

        {/*CHAT BODY*/}
        <div ref={chatBodyRef} className="chat-body">
          <div className='message bot-message'>
            <img src={denni} alt="icon" />
            <p className="message-text">Hey there! 🚗 I am Denni, your travel buddy from The Rental Den - Cebu! Need a ride? I can help you find the perfect car or van. Where are we headed today?</p>
          </div>

        {/* RENDERING CHAT HISTORY DYNAMICALLY */}
          {chatHistory.map((chat, index) =>(
            <ChatMessage key={index} chat={chat}/>
          ))}
        </div>

        {/*CHAT FOOTER*/}
        <div className="chat-footer">
          <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse}/>
        </div>
      </div>
    </div>
  )
}

export default RentalBot
