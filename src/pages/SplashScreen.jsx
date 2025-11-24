import { motion } from 'framer-motion';
import './SplashScreen.css';

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-bg"></div>
      
      <motion.div
        className="splash-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="splash-icon"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          🚻
        </motion.div>

        <motion.h1
          className="splash-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Bathroom AI
        </motion.h1>

        <motion.p
          className="splash-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          For NYC Delivery Riders
        </motion.p>

        <motion.div
          className="splash-loader"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.8, duration: 2 }}
        />
      </motion.div>

      <motion.div
        className="splash-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <p>AI-powered bathroom finder</p>
      </motion.div>
    </div>
  );
}

export default SplashScreen;