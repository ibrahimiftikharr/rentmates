import { Building2, Users, Shield, Home } from 'lucide-react';
import { motion } from 'motion/react';

export function IllustrationPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-purple-500 p-12 flex-col justify-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-lg text-white space-y-12">
        {/* Logo and Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
            <Home className="h-7 w-7 text-white" />
          </div>
          <span className="text-3xl">Rentmates</span>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-xl text-purple-100">
            Trusted student housing platform connecting you with quality accommodations
          </p>
        </motion.div>

        {/* Stats - Single Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-2xl mb-1">500+</h3>
            <p className="text-xs text-purple-100">Properties</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-2xl mb-1">2K+</h3>
            <p className="text-xs text-purple-100">Students</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-2xl mb-1">100%</h3>
            <p className="text-xs text-purple-100">Verified</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
