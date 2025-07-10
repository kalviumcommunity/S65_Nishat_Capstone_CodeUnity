import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import codeunityLogo from '../assets/logo.png';
import { FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('HOME');
  const [isManualNavigation, setIsManualNavigation] = useState(false);

  const joinRoomRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const howToUseRef = useRef(null);
  const testimonialsRef = useRef(null);
  const faqRef = useRef(null);
  const connectRef = useRef(null);

  const scrollToSection = (ref, sectionName) => {
    if (sectionName === 'HOME') {
      setIsManualNavigation(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('HOME');
      setIsMenuOpen(false);
      
      setTimeout(() => setIsManualNavigation(false), 800);
      return;
    }
    
    setIsManualNavigation(true);
    setActiveSection(sectionName);
    setIsMenuOpen(false);
    
    let element = ref?.current;
    
    if (!element) {
      const sectionMap = {
        'ABOUT': 'about-section',
        'FEATURES': 'features-section', 
        'HOW TO USE': 'howto-section',
        'TESTIMONIALS': 'testimonials-section',
        'FAQ': 'faq-section',
        'CONTACT': 'contact-section'
      };
      
      const elementId = sectionMap[sectionName];
      if (elementId) {
        element = document.getElementById(elementId);
      }
    }
    
    if (!element) {
      setIsManualNavigation(false);
      return;
    }
    
    // Get the element position using getBoundingClientRect
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const headerHeight = 100; // Account for sticky header with some extra padding
    const targetPosition = rect.top + scrollTop - headerHeight;
    
    // Direct scroll approach
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
    
    // Reset manual navigation flag after scrolling completes
    setTimeout(() => {
      setIsManualNavigation(false);
    }, 800);
  };

  // Scroll tracking and section detection
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Don't update active section if user manually clicked navigation
      if (isManualNavigation) {
        return;
      }
      
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const scrollCenter = scrollTop + (viewportHeight / 2); // Use center of viewport for detection
      
      // If we're at the very top, always show HOME
      if (scrollTop < 200) {
        setActiveSection('HOME');
        return;
      }
      
      // Get all section elements and their positions
      const sections = [
        { name: 'ABOUT', ref: aboutRef },
        { name: 'FEATURES', ref: featuresRef },
        { name: 'HOW TO USE', ref: howToUseRef },
        { name: 'TESTIMONIALS', ref: testimonialsRef },
        { name: 'FAQ', ref: faqRef },
        { name: 'CONTACT', ref: connectRef }
      ];

      let newActiveSection = 'HOME';
      let closestSection = null;
      let minDistance = Infinity;
      
      // Find which section's center is closest to the viewport center
      sections.forEach(section => {
        if (section.ref?.current) {
          const element = section.ref.current;
          const rect = element.getBoundingClientRect();
          const elementTop = scrollTop + rect.top;
          const elementBottom = elementTop + rect.height;
          const elementCenter = elementTop + (rect.height / 2);
          
          // Check if viewport center is within this section's bounds
          if (scrollCenter >= elementTop - 100 && scrollCenter <= elementBottom + 100) {
            const distance = Math.abs(scrollCenter - elementCenter);
            if (distance < minDistance) {
              minDistance = distance;
              closestSection = section.name;
            }
          }
        }
      });
      
      if (closestSection) {
        newActiveSection = closestSection;
      } else {
        // Fallback: find the section we've scrolled past most recently
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section.ref?.current) {
            const elementTop = section.ref.current.offsetTop;
            if (scrollTop >= elementTop - 200) {
              newActiveSection = section.name;
              break;
            }
          }
        }
      }

      setActiveSection(newActiveSection);
    };

    // Set initial state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isManualNavigation]);

  const createRoom = () => {
    const id = uuidv4();
    setRoomId(id);
    joinRoomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const joinRoom = () => {
    if (!roomId || !username) return alert('Both Room ID and Username required');
    navigate(`/editor/${roomId}`, { state: { username } });
  };

  return (
    <div className="min-h-screen relative bg-gray-900/80">
      {/* Navigation - Dynamic transparency based on scroll */}
      <nav 
        className="sticky top-0 z-50 px-6 lg:px-12 py-6 border-b border-white/5 transition-all duration-300"
        style={{
          backgroundColor: `rgba(17, 24, 39, ${Math.min(0.95, 0.7 + scrollY * 0.001)})`,
          backdropFilter: `blur(${Math.min(20, 12 + scrollY * 0.02)}px)`
        }}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <img 
              src={codeunityLogo} 
              alt="CodeUnity" 
              className="h-10 w-auto object-contain"
            />
            <span className="text-white font-bold text-xl tracking-tight">CODE UNITY</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { name: 'HOME', ref: null },
              { name: 'ABOUT', ref: aboutRef },
              { name: 'FEATURES', ref: featuresRef },
              { name: 'HOW TO USE', ref: howToUseRef },
              { name: 'TESTIMONIALS', ref: testimonialsRef },
              { name: 'FAQ', ref: faqRef },
              { name: 'CONTACT', ref: connectRef }
            ].map((item) => (
              <button
                key={item.name}
                className={`text-xs font-semibold tracking-wider transition-all duration-300 ${
                  activeSection === item.name
                    ? 'text-white relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-pink-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollToSection(item.ref, item.name);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden text-white p-2"
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <motion.div
                animate={isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="h-0.5 w-full bg-white origin-left"
              />
              <motion.div
                animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="h-0.5 w-full bg-white"
              />
              <motion.div
                animate={isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="h-0.5 w-full bg-white origin-left"
              />
            </div>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden"
        >
          <div className="pt-6 pb-4 space-y-4">
            {[
              { name: 'HOME', ref: null },
              { name: 'ABOUT', ref: aboutRef },
              { name: 'FEATURES', ref: featuresRef },
              { name: 'HOW TO USE', ref: howToUseRef },
              { name: 'TESTIMONIALS', ref: testimonialsRef },
              { name: 'FAQ', ref: faqRef },
              { name: 'CONTACT', ref: connectRef }
            ].map((item) => (
              <button
                key={item.name}
                className={`block text-left text-sm font-medium transition-colors duration-300 ${
                  activeSection === item.name 
                    ? 'text-pink-400 font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  scrollToSection(item.ref, item.name);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </motion.div>
      </nav>

      {/* Main Content with Background */}
      <div className="relative overflow-hidden">
        {/* Modern Dark Background with Geometric Pattern */}
        <div className="absolute inset-0">
          {/* Base dark layer */}
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          
          {/* Diagonal lines pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.05) 2px,
              rgba(255,255,255,0.05) 4px
            )`
          }}></div>
          
          {/* Pink/Purple accent glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-2xl"></div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 px-6 lg:px-12 pt-8 pb-20">
        {/* Radial gradient overlay for hero */}
        <div className="absolute inset-0 bg-gradient-radial from-pink-400/15 via-purple-500/5 to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center min-h-[75vh]">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="space-y-4"
              >
                <h1 className="text-5xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                  <span className="text-white block mb-2">
                    Code Together,
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-600 block mb-2">
                    Build Faster
                  </span>
                  <span className="text-white block">
                    With AI
                  </span>
                </h1>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-gray-400 text-xl leading-relaxed max-w-2xl"
              >
                Experience the future of collaborative coding. Real-time synchronization, 
                AI-powered assistance, and seamless team collaboration in one platform.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-lg transition-all duration-300"
                  onClick={createRoom}
                >
                  Start Coding Now
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-2xl border border-gray-600/50 text-gray-300 font-semibold text-lg hover:bg-gray-800/30 hover:border-gray-500 transition-all duration-300"
                  onClick={() => joinRoomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Demo
                </motion.button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center gap-8 pt-8 border-t border-gray-800/50"
              >
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">50K+</div>
                  <div className="text-gray-500 text-sm">Developers</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">10K+</div>
                  <div className="text-gray-500 text-sm">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-bold">100+</div>
                  <div className="text-gray-500 text-sm">Languages</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Simplified Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative flex items-center justify-center -mt-12"
            >
              {/* Main Visual Container */}
              <div className="relative">
                {/* Central Code Block */}
                <div className="relative bg-gray-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/30 max-w-sm mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-gray-400 text-xs font-mono">CodeUnity.js</span>
                  </div>

                  {/* Code Content */}
                  <div className="space-y-3 font-mono text-sm">
                    <div className="text-purple-400">function <span className="text-blue-400">collaborate</span>() {'{'}</div>
                    <div className="pl-4 text-gray-300">const <span className="text-green-400">team</span> = <span className="text-orange-400">new</span> <span className="text-blue-400">CodeUnity</span>();</div>
                    <div className="pl-4 text-gray-300">team.<span className="text-pink-400">enableAI</span>();</div>
                    <div className="pl-4 text-gray-300"><span className="text-purple-400">return</span> team.<span className="text-pink-400">code</span>();</div>
                    <div className="text-purple-400">{'}'}</div>
                  </div>

                  {/* AI Indicator */}
                  <div className="mt-6 flex items-center gap-3 p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">AI Assistant Active</div>
                      <div className="text-gray-400 text-xs">Ready to help with your code</div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Floating Elements - Simplified */}
                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 w-12 h-12 bg-pink-500/20 rounded-2xl backdrop-blur-sm border border-pink-500/30 flex items-center justify-center"
                >
                  <span className="text-pink-400 text-lg">⚡</span>
                </motion.div>
                
                <motion.div
                  animate={{ 
                    y: [0, 8, 0],
                    rotate: [0, -5, 0]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-6 -left-6 w-10 h-10 bg-purple-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30 flex items-center justify-center"
                >
                  <span className="text-purple-400">🚀</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Join Room Section */}
      <div className="relative z-10 px-6 lg:px-12 pb-24">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-radial from-pink-400/12 via-transparent to-transparent opacity-60 rounded-3xl"></div>
        <div className="max-w-lg mx-auto relative z-10">
          <motion.div
            ref={joinRoomRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gray-900/40 backdrop-blur-xl rounded-3xl p-10 border border-gray-700/30"
          >
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-white mb-3">Join Room</h2>
              <p className="text-gray-400 text-lg">Start collaborating with your team instantly</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-medium block">Room ID</label>
                <input
                  type="text"
                  placeholder="Enter room identifier"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-black/40 text-white placeholder-gray-500 border border-gray-700/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-medium block">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-black/40 text-white placeholder-gray-500 border border-gray-700/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={joinRoom}
                className="w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-lg transition-all duration-300"
              >
                Join Room →
              </motion.button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700/50"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gray-900/40 px-4 text-gray-500 text-sm">or</span>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={createRoom}
                className="w-full px-5 py-4 rounded-2xl border border-gray-600/40 text-gray-300 font-semibold text-lg hover:bg-gray-800/20 hover:border-gray-500 transition-all duration-300"
              >
                Create New Room
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* About Section */}
          <div ref={aboutRef} id="about-section" className="text-center relative">
            {/* Enhanced radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/12 via-purple-400/6 to-transparent opacity-60 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-16"
            >
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-white">About CodeUnity</h2>
                <p className="text-gray-400 text-lg max-w-4xl mx-auto leading-relaxed">
                  CodeUnity is a revolutionary AI-powered collaborative coding platform that transforms how developers work together. 
                  Built for the modern era of remote development, we bridge the gap between individual creativity and team productivity 
                  through seamless real-time collaboration and intelligent code assistance.
                </p>
              </div>

              {/* Mission & Vision */}
              <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-left"
                >
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/30 hover:border-pink-500/20 transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">🎯</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">Our Mission</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      To democratize collaborative coding by providing developers worldwide with cutting-edge tools that enhance creativity, 
                      boost productivity, and foster innovation. We believe that great code emerges when brilliant minds work together seamlessly, 
                      regardless of geographical boundaries.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-left"
                >
                  <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/30 hover:border-pink-500/20 transition-all duration-300 h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">🚀</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      To become the global standard for collaborative development environments, where every line of code written is enhanced by AI, 
                      every collaboration is frictionless, and every developer can reach their full potential through the power of unified teamwork 
                      and intelligent assistance.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Key Benefits */}
              <div className="space-y-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <h3 className="text-3xl font-bold text-white mb-8">Why Choose CodeUnity?</h3>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      {
                        icon: "⚡",
                        title: "Real-Time Synchronization",
                        description: "Experience lightning-fast real-time code synchronization with zero conflicts. Watch your team's changes appear instantly with our advanced operational transformation algorithms."
                      },
                      {
                        icon: "🤖",
                        title: "AI-Powered Intelligence",
                        description: "Leverage GitHub Copilot integration for intelligent code suggestions, automated debugging, and context-aware assistance that learns from your coding patterns."
                      },
                      {
                        icon: "🌐",
                        title: "Universal Language Support",
                        description: "Support for 100+ programming languages with syntax highlighting, auto-completion, and language-specific optimizations for every major framework and library."
                      },
                      {
                        icon: "🔒",
                        title: "Enterprise Security",
                        description: "Bank-grade encryption, secure room management, and privacy-first architecture ensure your code remains protected while enabling seamless collaboration."
                      },
                      {
                        icon: "📱",
                        title: "Cross-Platform Access",
                        description: "Access your coding environment from any device with our responsive web interface, optimized for desktop development with mobile monitoring capabilities."
                      },
                      {
                        icon: "🎨",
                        title: "Beautiful Interface",
                        description: "Stunning, distraction-free interface designed for developers, featuring customizable themes, intuitive layouts, and eye-friendly color schemes."
                      }
                    ].map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
                        className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/30 hover:border-pink-500/20 transition-all duration-300 group"
                      >
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                          {benefit.icon}
                        </div>
                        <h4 className="text-xl font-bold text-white mb-3">{benefit.title}</h4>
                        <p className="text-gray-400 leading-relaxed text-sm">{benefit.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Technical Excellence */}
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-12 border border-gray-700/30">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="space-y-8"
                >
                  <h3 className="text-3xl font-bold text-white">Built with Modern Technology</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      {
                        category: "Frontend",
                        technologies: ["React 18", "Vite", "Tailwind CSS", "Framer Motion"]
                      },
                      {
                        category: "Backend", 
                        technologies: ["Node.js", "Express", "Socket.IO", "MongoDB"]
                      },
                      {
                        category: "AI Integration",
                        technologies: ["GitHub Copilot", "Monaco Editor", "Language Servers", "Code Analysis"]
                      },
                      {
                        category: "Infrastructure",
                        technologies: ["Real-time Sync", "Cloud Deployment", "CDN", "Load Balancing"]
                      }
                    ].map((tech, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                        className="text-center"
                      >
                        <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 mb-4">
                          {tech.category}
                        </h4>
                        <ul className="space-y-2">
                          {tech.technologies.map((item, idx) => (
                            <li key={idx} className="text-gray-400 text-sm">{item}</li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Call to Action */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/30"
              >
                <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Development Workflow?</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Join thousands of developers who have revolutionized their coding experience with CodeUnity. 
                  Start collaborating smarter, coding faster, and building better software today.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createRoom}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Coding Now →
                </motion.button>
              </motion.div>
            </motion.div>
          </div>

          {/* Features Section */}
          <div ref={featuresRef} id="features-section" className="text-center relative">
            {/* Enhanced radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/15 via-purple-400/8 to-transparent opacity-70 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-16"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-pink-500/10 border border-pink-500/20 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                  <span className="text-pink-300 text-sm font-medium">AI-Powered Collaboration Platform</span>
                </div>
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-5xl font-bold text-white">Core Features</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Discover the powerful tools that make CodeUnity the ultimate collaborative coding platform
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "⚡",
                    title: "Real-time Collaboration",
                    description: "Code together seamlessly with perfect synchronization across all devices and team members"
                  },
                  {
                    icon: "🤖",
                    title: "AI-Powered Assistant",
                    description: "Get intelligent code suggestions, automated debugging, and context-aware assistance"
                  },
                  {
                    icon: "🌐",
                    title: "Multi-language Support",
                    description: "Support for 100+ programming languages with advanced syntax highlighting"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="group bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-pink-500/30 transition-all duration-300"
                  >
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* How to Use Section */}
          <div ref={howToUseRef} id="howto-section" className="text-center relative">
            {/* Radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/11 via-purple-400/5 to-transparent opacity-55 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-12"
            >
              <h2 className="text-4xl font-bold text-white">How to Use CodeUnity</h2>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    step: "01",
                    title: "Create or Join Room",
                    description: "Start by creating a new coding room or join an existing one with a room ID"
                  },
                  {
                    step: "02", 
                    title: "Invite Your Team",
                    description: "Share the room ID with your team members to collaborate in real-time"
                  },
                  {
                    step: "03",
                    title: "Code Together",
                    description: "Write, edit, and debug code together with AI assistance and live synchronization"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="relative"
                  >
                    <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/30 hover:border-pink-500/20 transition-all duration-300">
                      <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 mb-4">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Testimonials Section */}
          <div ref={testimonialsRef} id="testimonials-section" className="text-center relative">
            {/* Enhanced radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/14 via-purple-400/7 to-transparent opacity-65 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-12"
            >
              <h2 className="text-5xl font-bold text-white">What Developers Say</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    name: "Sarah Chen",
                    role: "Senior Frontend Developer",
                    company: "TechCorp",
                    quote: "CodeUnity has revolutionized how our team collaborates. The AI assistance is incredibly helpful!",
                    rating: 5
                  },
                  {
                    name: "Marcus Rodriguez", 
                    role: "Full Stack Engineer",
                    company: "StartupLab",
                    quote: "Real-time collaboration has never been this smooth. It's like having the whole team in one room.",
                    rating: 5
                  },
                  {
                    name: "Emily Johnson",
                    role: "DevOps Engineer", 
                    company: "CloudTech",
                    quote: "The AI-powered suggestions have saved us countless hours of debugging. Absolutely love it!",
                    rating: 5
                  },
                  {
                    name: "David Kim",
                    role: "Backend Developer",
                    company: "DataFlow",
                    quote: "Perfect for remote teams. The synchronization is flawless and the interface is intuitive.",
                    rating: 5
                  },
                  {
                    name: "Lisa Thompson",
                    role: "Mobile Developer",
                    company: "AppStudio",
                    quote: "CodeUnity has become an essential tool for our development workflow. Highly recommended!",
                    rating: 5
                  },
                  {
                    name: "Alex Morgan",
                    role: "Tech Lead",
                    company: "InnovateLab",
                    quote: "The best collaborative coding platform I've used. The AI features are game-changing.",
                    rating: 5
                  }
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/30 hover:border-pink-500/20 transition-all duration-300"
                  >
                    <div className="flex justify-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xl">★</span>
                      ))}
                    </div>
                    <p className="text-white/80 mb-6 italic">"{testimonial.quote}"</p>
                    <div className="text-center">
                      <h4 className="text-white font-semibold">{testimonial.name}</h4>
                      <p className="text-white/60 text-sm">{testimonial.role}</p>
                      <p className="text-cyan-400 text-sm">{testimonial.company}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* FAQ Section */}
          <div ref={faqRef} id="faq-section" className="text-center relative">
            {/* Radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/10 via-transparent to-transparent opacity-50 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-8"
            >
              <h2 className="text-4xl font-bold text-white">Frequently Asked Questions</h2>
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
                {[
                  {
                    question: "How many people can collaborate in one room?",
                    answer: "CodeUnity supports up to 50 concurrent users in a single room, making it perfect for teams of any size."
                  },
                  {
                    question: "What programming languages are supported?",
                    answer: "We support over 100 programming languages including JavaScript, Python, Java, C++, React, Node.js, and many more."
                  },
                  {
                    question: "Is my code secure and private?",
                    answer: "Yes! All code is encrypted in transit and at rest. We use enterprise-grade security to protect your intellectual property."
                  },
                  {
                    question: "Can I use CodeUnity for free?",
                    answer: "Yes, we offer a free tier with basic features. Premium plans are available for advanced AI features and larger teams."
                  },
                  {
                    question: "Does CodeUnity work offline?",
                    answer: "CodeUnity requires an internet connection for real-time collaboration, but you can work locally and sync when reconnected."
                  },
                  {
                    question: "How does the AI assistance work?",
                    answer: "Our AI analyzes your code in real-time to provide suggestions, detect bugs, optimize performance, and help with documentation."
                  }
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                    className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-5 border border-gray-700/30 hover:border-pink-500/20 transition-all duration-300 text-left"
                  >
                    <h3 className="text-base font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Contact Section */}
          <div ref={connectRef} id="contact-section" className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <h2 className="text-4xl font-bold text-white">Connect With Us</h2>
              <div className="flex justify-center gap-6">
                <motion.a
                  href="mailto:nishatayub702@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <MdEmail className="text-xl text-white" />
                </motion.a>
                <motion.a
                  href="https://linkedin.com/in/nishatayub"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <FaLinkedin className="text-xl text-white" />
                </motion.a>
                <motion.a
                  href="https://github.com/nishatayub"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <FaGithub className="text-xl text-white" />
                </motion.a>
                <motion.a
                  href="https://instagram.com/nishatayub"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <FaInstagram className="text-xl text-white" />
                </motion.a>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/80 backdrop-blur-xl border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
            
            {/* CodeUnity Brand & Quote */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <img 
                  src={codeunityLogo} 
                  alt="CodeUnity" 
                  className="h-10 w-auto object-contain"
                />
                <span className="text-white font-bold text-xl tracking-tight">CODE UNITY</span>
              </motion.div>
              
              <blockquote className="text-gray-400 italic text-sm leading-relaxed">
                "Code is like humor. When you have to explain it, it's bad."<br />
                <span className="text-pink-400 not-italic font-medium">- Cory House</span>
              </blockquote>
              
              <p className="text-gray-500 text-sm leading-relaxed">
                Empowering developers worldwide with AI-enhanced collaborative coding solutions. 
                Building the future of software development, one line of code at a time.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Quick Links</h3>
              <ul className="space-y-3">
                {[
                  { name: 'Home', ref: null },
                  { name: 'Features', ref: featuresRef },
                  { name: 'How to Use', ref: howToUseRef },
                  { name: 'Testimonials', ref: testimonialsRef },
                  { name: 'FAQ', ref: faqRef }
                ].map((link, index) => (
                  <li key={index}>
                    <motion.button
                      onClick={() => link.ref ? scrollToSection(link.ref) : window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-gray-400 hover:text-pink-400 transition-colors text-sm"
                      whileHover={{ x: 5 }}
                    >
                      {link.name}
                    </motion.button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Product */}
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Product</h3>
              <ul className="space-y-3">
                {[
                  'Real-time Collaboration',
                  'AI Code Assistant',
                  'Multi-language Support',
                  'Code Execution',
                  'Team Management',
                  'Version Control'
                ].map((feature, index) => (
                  <li key={index} className="text-gray-400 text-sm">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg">Connect With Us</h3>
              
              {/* Contact Info */}
              <div className="space-y-4">
                <motion.a
                  href="mailto:nishatayub702@gmail.com"
                  className="flex items-center gap-3 text-gray-400 hover:text-pink-400 transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <MdEmail className="text-lg" />
                  <span className="text-sm">nishatayub702@gmail.com</span>
                </motion.a>
                
                <div className="flex items-center gap-3 text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Remote • Worldwide</span>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-gray-500 text-sm mb-4">Follow us on social media</p>
                <div className="flex gap-4">
                  <motion.a
                    href="https://linkedin.com/in/nishatayub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-gray-700/50 hover:bg-blue-600/20 hover:border-blue-400/50 transition-all"
                  >
                    <FaLinkedin className="text-lg text-gray-300" />
                  </motion.a>
                  <motion.a
                    href="https://github.com/nishatayub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-gray-700/50 hover:bg-gray-600/20 hover:border-gray-400/50 transition-all"
                  >
                    <FaGithub className="text-lg text-gray-300" />
                  </motion.a>
                  <motion.a
                    href="https://instagram.com/nishatayub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-gray-700/50 hover:bg-pink-600/20 hover:border-pink-400/50 transition-all"
                  >
                    <FaInstagram className="text-lg text-gray-300" />
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-500 text-sm">
                © 2024 CodeUnity. All rights reserved. Built with ❤️ for developers.
              </div>
              
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-pink-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-500 hover:text-pink-400 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-500 hover:text-pink-400 transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
