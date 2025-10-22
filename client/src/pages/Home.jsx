import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import codeunityLogo from '../assets/logo.png';
import { FaLinkedin, FaGithub, FaInstagram, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { Target, Rocket, Zap, Bot, Globe, Lock, Smartphone, Palette } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useUsageTracking } from '../hooks/useUsageTracking';

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('HOME');
  const [isManualNavigation, setIsManualNavigation] = useState(false);
  
  // Authentication
  const { user, setUserAuth } = useUsageTracking();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const joinRoomRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const connectRef = useRef(null);

  // Authentication handlers
  const handleAuth = (userData) => {
    setUserAuth(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('codeunity_user');
    localStorage.removeItem('codeunity_token');
    setUserAuth(null);
  };

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
        'TESTIMONIALS': 'testimonials-section',
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
        { name: 'TESTIMONIALS', ref: testimonialsRef },
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
    <div className="min-h-screen relative bg-black/90">
      {/* Navigation - Dynamic transparency based on scroll */}
      <nav 
        className="sticky top-0 z-50 px-6 lg:px-12 py-2"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${Math.min(0.95, 0.7 + scrollY * 0.001)})`,
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
              { name: 'TESTIMONIALS', ref: testimonialsRef },
              { name: 'CONTACT', ref: connectRef }
            ].map((item) => (
              <button
                key={item.name}
                className={`text-xs font-semibold tracking-wider transition-all duration-300 ${
                  activeSection === item.name
                    ? 'text-white relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-pink-500' 
                    : 'text-white/70 hover:text-white'
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
            
            {/* Authentication Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-pink-500/30">
                  <FaUser className="w-3 h-3 text-pink-400" />
                  <span className="text-xs text-white font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-black/30 hover:bg-black/40 border border-pink-500/20 hover:border-pink-500/30 text-white/80 hover:text-white transition-all duration-200"
                  title="Logout"
                >
                  <FaSignOutAlt className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAuthModal(true)}
                whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(236, 72, 153, 0.25)" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500/15 to-pink-500/15 border border-pink-500/30 hover:border-pink-500/50 text-white hover:text-white transition-all duration-300 backdrop-blur-sm"
                title="Sign In to CodeUnity"
              >
                <div className="flex items-center gap-2">
                  <FaUser className="w-3 h-3" />
                  <span className="text-sm font-semibold">Sign In</span>
                </div>
              </motion.button>
            )}
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
              { name: 'TESTIMONIALS', ref: testimonialsRef },
              { name: 'CONTACT', ref: connectRef }
            ].map((item) => (
              <button
                key={item.name}
                className={`block text-left text-sm font-medium transition-colors duration-300 ${
                  activeSection === item.name 
                    ? 'text-white font-semibold' 
                    : 'text-white/70 hover:text-white'
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
            
            {/* Mobile Authentication */}
            <div className="pt-2 border-t border-pink-500/20">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-pink-400" />
                    <span className="text-sm text-white">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg bg-black/30 hover:bg-black/40 border border-pink-500/20 text-white/80 hover:text-white transition-all duration-200"
                    title="Logout"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <motion.button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsMenuOpen(false);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 rounded-xl bg-linear-to-r from-pink-500/15 to-pink-500/15 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 hover:text-pink-300 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <FaUser className="w-4 h-4" />
                    <span className="text-sm font-semibold">Sign In</span>
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Main Content with Background */}
      <div className="relative overflow-hidden">
        {/* Modern Dark Background with Geometric Pattern */}
        <div className="absolute inset-0">
          {/* Base dark layer */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl"></div>
          
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
          
          {/* Pink accent glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl"></div>
        </div>

        {/* Hero Section - 2 Panel Layout */}
        <div className="relative z-10 px-6 lg:px-12 pt-20 pb-32 overflow-hidden">
          {/* Gradient Background Effects */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-600/30 via-pink-600/20 to-transparent rounded-full blur-3xl -z-10"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-600/25 via-pink-600/15 to-transparent rounded-full blur-3xl -z-10"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Panel - Hero Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-8"
              >
                {/* Main Heading */}
                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tight"
                  >
                    <span className="block text-white">Code Together.</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-400 to-pink-500">
                      Build Faster.
                    </span>
                    <span className="block text-white">With AI Power.</span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-base lg:text-lg text-white/80 leading-relaxed pt-4"
                  >
                    Real-time code synchronization, AI-powered suggestions, and seamless team collaboration. Everything you need to build amazing projects together.
                  </motion.p>
                </div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 pt-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={createRoom}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-bold shadow-lg shadow-pink-500/30 border border-pink-400/20 hover:border-pink-400/40 transition-all duration-300"
                  >
                    Start Building
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => joinRoomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-3.5 rounded-xl border-2 border-pink-600/50 text-pink-300 font-bold hover:bg-black/50 hover:border-pink-500 transition-all duration-300"
                  >
                    Learn More
                  </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="grid grid-cols-3 gap-6 pt-8 border-t border-pink-900/50"
                >
                  <motion.div whileHover={{ y: -3 }} className="space-y-1">
                    <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-300">50K+</div>
                    <p className="text-xs text-white/50 uppercase tracking-wider">Users</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -3 }} className="space-y-1">
                    <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-300">10K+</div>
                    <p className="text-xs text-white/50 uppercase tracking-wider">Projects</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -3 }} className="space-y-1">
                    <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-pink-300">100+</div>
                    <p className="text-xs text-white/50 uppercase tracking-wider">Languages</p>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Right Panel - Join Room Form */}
              <motion.div
                ref={joinRoomRef}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                {/* Glowing effect behind form */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-pink-500/10 to-transparent rounded-3xl blur-2xl"></div>
                
                <div className="relative bg-black/60 backdrop-blur-2xl rounded-3xl p-8 lg:p-10 border border-pink-500/20 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-4">
                      <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                      <span className="text-pink-300 text-xs font-medium">Start Coding Now</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Join Room</h2>
                    <p className="text-white/80 text-sm">Start collaborating with your team instantly</p>
                  </div>
                  
                  {/* Form */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-pink-500 to-pink-500 rounded-full"></span>
                        Room ID
                      </label>
                      <input
                        type="text"
                        placeholder="Enter room identifier"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black/30 text-white placeholder-white/40 border border-pink-500/20 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-pink-500 to-pink-500 rounded-full"></span>
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl bg-black/30 text-white placeholder-white/40 border border-pink-500/20 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50 transition-all"
                      />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(236, 72, 153, 0.25)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={joinRoom}
                      className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold text-base transition-all duration-300 shadow-lg shadow-pink-500/20"
                    >
                      Join Room →
                    </motion.button>
                    
                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-pink-500/20"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-black/60 px-3 text-white/60 text-xs">or</span>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={createRoom}
                      className="w-full px-5 py-3.5 rounded-xl border border-pink-600/50 text-white font-semibold text-base hover:bg-black/50 hover:border-pink-500/50 transition-all duration-300"
                    >
                      Create New Room
                    </motion.button>
                  </div>

                  {/* Trust indicators */}
                  <div className="mt-6 pt-6 border-t border-pink-900/50">
                    <div className="flex items-center justify-center gap-6 text-xs text-white/50">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Secure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        <span>Collaborative</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>AI-Powered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

      {/* Additional Sections */}
      <div className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* Features Section */}
          <div ref={featuresRef} id="features-section" className="text-center relative">
            {/* Enhanced radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/15 via-pink-400/8 to-transparent opacity-70 rounded-3xl"></div>
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
                <p className="text-white/80 text-lg max-w-2xl mx-auto">
                  Discover the powerful tools that make CodeUnity the ultimate collaborative coding platform
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Zap,
                    iconColor: "from-pink-400 to-pink-500",
                    title: "Real-time Collaboration",
                    description: "Code together seamlessly with perfect synchronization across all devices and team members"
                  },
                  {
                    icon: Bot,
                    iconColor: "from-pink-400 to-pink-500",
                    title: "AI-Powered Assistant",
                    description: "Get intelligent code suggestions, automated debugging, and context-aware assistance"
                  },
                  {
                    icon: Globe,
                    iconColor: "from-pink-400 to-pink-500",
                    title: "Multi-language Support",
                    description: "Support for 100+ programming languages with advanced syntax highlighting"
                  }
                ].map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="relative group bg-black/60 backdrop-blur-2xl rounded-3xl p-8 border border-pink-500/20 hover:border-pink-500/30 transition-all duration-300"
                    >
                      {/* Glowing effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.iconColor} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-300`}></div>
                      
                      <div className="relative z-10 text-center">
                        <div className="flex justify-center mb-6">
                          <div className={`w-16 h-16 rounded-3xl bg-gradient-to-r ${feature.iconColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                        <p className="text-white/80 leading-relaxed">{feature.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Ready to Transform Section */}
          <div className="text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative bg-black/60 backdrop-blur-2xl rounded-3xl p-10 border border-pink-500/20 group"
            >
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-pink-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 text-center">
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Development Workflow?</h3>
                <p className="text-white/80 mb-8 leading-relaxed max-w-2xl mx-auto">
                  Join thousands of developers who have revolutionized their coding experience with CodeUnity. 
                  Start collaborating smarter, coding faster, and building better software today.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createRoom}
                  className="px-10 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all duration-300"
                >
                  Start Coding Now →
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* About Section */}
          <div ref={aboutRef} id="about-section" className="text-center relative">
            {/* Enhanced radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/12 via-pink-400/6 to-transparent opacity-60 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-16"
            >
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-white">About CodeUnity</h2>
                <p className="text-white/80 text-lg max-w-4xl mx-auto leading-relaxed">
                  CodeUnity is a revolutionary AI-powered collaborative coding platform that transforms how developers work together. 
                  Built for the modern era of remote development, we bridge the gap between individual creativity and team productivity 
                  through seamless real-time collaboration and intelligent code assistance.
                </p>
              </div>

              {/* Mission & Vision */}
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-left"
                >
                  <div className="relative bg-black/60 backdrop-blur-2xl rounded-3xl p-8 border border-pink-500/20 hover:border-pink-500/30 transition-all duration-300 h-full group">
                    {/* Glowing effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                          <Target className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Our Mission</h3>
                      </div>
                      <p className="text-white/80 leading-relaxed">
                        To democratize collaborative coding by providing developers worldwide with cutting-edge tools that enhance creativity, 
                        boost productivity, and foster innovation. We believe that great code emerges when brilliant minds work together seamlessly, 
                        regardless of geographical boundaries.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-left"
                >
                  <div className="relative bg-black/60 backdrop-blur-2xl rounded-3xl p-8 border border-pink-500/20 hover:border-pink-500/30 transition-all duration-300 h-full group">
                    {/* Glowing effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                          <Rocket className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                      </div>
                      <p className="text-white/80 leading-relaxed">
                        To become the global standard for collaborative development environments, where every line of code written is enhanced by AI, 
                        every collaboration is frictionless, and every developer can reach their full potential through the power of unified teamwork 
                        and intelligent assistance.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              
            </motion.div>
          </div>

          {/* Testimonials Section */}
          <div ref={testimonialsRef} id="testimonials-section" className="text-center relative">
            {/* Enhanced radial gradient background */}
            <div className="absolute inset-0 bg-gradient-radial from-pink-400/14 via-pink-400/7 to-transparent opacity-65 rounded-3xl"></div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 space-y-12"
            >
              <h2 className="text-5xl font-bold text-white">What Developers Say</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "Sarah Chen",
                    role: "Senior Frontend Developer",
                    company: "TechCorp",
                    quote: "CodeUnity has revolutionized how our team collaborates. The AI assistance is incredibly helpful!",
                    rating: 5,
                    gradient: "from-pink-500/10 to-pink-500/10"
                  },
                  {
                    name: "Marcus Rodriguez", 
                    role: "Full Stack Engineer",
                    company: "StartupLab",
                    quote: "Real-time collaboration has never been this smooth. It's like having the whole team in one room.",
                    rating: 5,
                    gradient: "from-pink-500/10 to-pink-500/10"
                  },
                  {
                    name: "Emily Johnson",
                    role: "DevOps Engineer", 
                    company: "CloudTech",
                    quote: "The AI-powered suggestions have saved us countless hours of debugging. Absolutely love it!",
                    rating: 5,
                    gradient: "from-pink-500/10 to-pink-500/10"
                  },
                  {
                    name: "David Kim",
                    role: "Backend Developer",
                    company: "DataFlow",
                    quote: "Perfect for remote teams. The synchronization is flawless and the interface is intuitive.",
                    rating: 5,
                    gradient: "from-pink-500/10 to-pink-500/10"
                  },
                  {
                    name: "Lisa Thompson",
                    role: "Mobile Developer",
                    company: "AppStudio",
                    quote: "CodeUnity has become an essential tool for our development workflow. Highly recommended!",
                    rating: 5,
                    gradient: "from-pink-500/10 to-pink-500/10"
                  },
                  {
                    name: "Alex Morgan",
                    role: "Tech Lead",
                    company: "InnovateLab",
                    quote: "The best collaborative coding platform I've used. The AI features are game-changing.",
                    rating: 5,
                    gradient: "from-pink-500/10 to-pink-500/10"
                  }
                ].map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className="relative group bg-black/60 backdrop-blur-2xl rounded-3xl p-6 border border-pink-500/20 hover:border-pink-500/30 transition-all duration-300"
                  >
                    {/* Glowing effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-white/80 text-xl">★</span>
                        ))}
                      </div>
                      <p className="text-white/80 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                      <div className="text-center pt-4 border-t border-pink-900/50">
                        <h4 className="text-white font-semibold">{testimonial.name}</h4>
                        <p className="text-white/60 text-sm">{testimonial.role}</p>
                        <p className="text-white/80 text-sm font-medium">{testimonial.company}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          

        </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black/90 backdrop-blur-xl border-t border-pink-900/50">
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
              
              <blockquote className="text-white/80 italic text-sm leading-relaxed">
                "Code is like humor. When you have to explain it, it's bad."<br />
                <span className="text-pink-400 not-italic font-medium">- Cory House</span>
              </blockquote>
              
              <p className="text-white/70 text-sm leading-relaxed">
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
                  { name: 'Testimonials', ref: testimonialsRef },
                  { name: 'Contact', ref: connectRef }
                ].map((link, index) => (
                  <li key={index}>
                    <motion.button
                      onClick={() => link.ref ? scrollToSection(link.ref) : window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-white/70 hover:text-white transition-colors text-sm"
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
                  <li key={index} className="text-white/70 text-sm">
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
                  className="flex items-center gap-3 text-white/70 hover:text-white transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <MdEmail className="text-lg" />
                  <span className="text-sm">nishatayub702@gmail.com</span>
                </motion.a>
                
                <div className="flex items-center gap-3 text-white/70">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Remote • Worldwide</span>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-white/70 text-sm mb-4">Follow us on social media</p>
                <div className="flex gap-4">
                  <motion.a
                    href="https://linkedin.com/in/nishatayub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-pink-500/20 hover:bg-pink-600/20 hover:border-pink-400/50 transition-all"
                  >
                    <FaLinkedin className="text-lg text-white/80" />
                  </motion.a>
                  <motion.a
                    href="https://github.com/nishatayub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-pink-500/20 hover:bg-pink-600/20 hover:border-pink-400/50 transition-all"
                  >
                    <FaGithub className="text-lg text-white/80" />
                  </motion.a>
                  <motion.a
                    href="https://instagram.com/nishatayub"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-pink-500/20 hover:bg-pink-600/20 hover:border-pink-400/50 transition-all"
                  >
                    <FaInstagram className="text-lg text-white/80" />
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-pink-900/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-white/70 text-sm">
                © 2024 CodeUnity. All rights reserved. Built with ❤️ for developers.
              </div>
              
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={handleAuth}
      />
    </div>
  );
};

export default Home;
