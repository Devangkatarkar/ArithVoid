"use client";

import { motion } from "framer-motion";
import { FolderArchive, Laptop, Smartphone, Server } from "lucide-react";

function Node({
  icon,
  label,
  sub = "Secure sync",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute z-20 rounded-[28px] bg-white/42 px-5 py-4 shadow-[0_18px_50px_rgba(10,35,66,0.08)] ring-1 ring-white/35 backdrop-blur-2xl ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF6FD] text-[#0A2342]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0A2342]">{label}</p>
          <p className="text-xs text-[#5B778F]">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function MovingDot({
  cx,
  cy,
  dx,
  dy,
  delay = 0,
  color = "#7CC7F2",
}: {
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  delay?: number;
  color?: string;
}) {
  return (
    <motion.div
      className="absolute z-30 h-3 w-3 rounded-full"
      style={{
        left: cx,
        top: cy,
        backgroundColor: color,
      }}
      animate={{
        x: [0, dx],
        y: [0, dy],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
    />
  );
}

export default function FileShareOrbit() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[620px] overflow-hidden">
      {/* glow */}
      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7CC7F2]/16 blur-3xl" />
      <div className="absolute left-8 bottom-10 h-24 w-24 rounded-full bg-[#7CC7F2]/16 blur-3xl" />
      <div className="absolute right-10 top-10 h-24 w-24 rounded-full bg-[#0A2342]/8 blur-3xl" />

      {/* exact connection lines */}
      <svg
        className="absolute inset-0 z-10 h-full w-full"
        viewBox="0 0 620 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="310"
          y1="220"
          x2="150"
          y2="95"
          stroke="url(#beam1)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="310"
          y1="220"
          x2="500"
          y2="105"
          stroke="url(#beam2)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="310"
          y1="220"
          x2="175"
          y2="345"
          stroke="url(#beam3)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <defs>
          <linearGradient id="beam1" x1="310" y1="220" x2="150" y2="95">
            <stop offset="0%" stopColor="#7CC7F2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7CC7F2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam2" x1="310" y1="220" x2="500" y2="105">
            <stop offset="0%" stopColor="#7CC7F2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7CC7F2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beam3" x1="310" y1="220" x2="175" y2="345">
            <stop offset="0%" stopColor="#7CC7F2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7CC7F2" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* center */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 z-20 flex h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[42px] bg-white/42 shadow-[0_24px_70px_rgba(10,35,66,0.10)] ring-1 ring-white/35 backdrop-blur-2xl"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#EAF6FD] text-[#0A2342]">
          <FolderArchive size={30} />
        </div>

        <p className="mt-5 text-[18px] font-semibold text-[#0A2342]">
          project.zip
        </p>
        <p className="mt-2 text-sm text-[#5B778F]">Shared across devices</p>

        <motion.div
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="mt-4 rounded-full bg-[#97A8BA] px-4 py-1 text-xs font-medium text-white"
        >
          Synced
        </motion.div>
      </motion.div>

      {/* nodes */}
      <Node
        icon={<Laptop size={20} />}
        label="Desktop"
        className="left-[12px] top-[68px] w-[180px]"
      />

      <Node
        icon={<Smartphone size={20} />}
        label="Mobile"
        className="right-[12px] top-[78px] w-[180px]"
      />

      <Node
        icon={<Server size={20} />}
        label="Vault"
        className="left-[70px] top-[320px] w-[170px]"
      />

      {/* moving dots aligned to beams */}
      <MovingDot cx={305} cy={215} dx={-95} dy={-72} delay={0} color="#7CC7F2" />
      <MovingDot cx={305} cy={215} dx={110} dy={-66} delay={0.8} color="#0A2342" />
      <MovingDot cx={305} cy={215} dx={-82} dy={76} delay={1.4} color="#7CC7F2" />
    </div>
  );
}