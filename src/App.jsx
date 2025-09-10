import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage/LandingPage";
import ChatBox from "./components/ChatBox/ChatBox";

function App() {
  return (
    <div>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<ChatBox />} />
    </Routes>
  </BrowserRouter>
    </div>
  )
}

export default App


