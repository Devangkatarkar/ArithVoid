# 🚀 Arithvoid

<p align="center">
  <b>Secure • Fast • Temporary File Sharing for Teams</b><br/>
  Built with Next.js + Supabase
</p>

<p align="center">

  <!-- Repo Stats -->
  <img src="https://img.shields.io/github/stars/your-username/arithvoid?style=for-the-badge" />
  <img src="https://img.shields.io/github/forks/your-username/arithvoid?style=for-the-badge" />
  <img src="https://img.shields.io/github/issues/your-username/arithvoid?style=for-the-badge" />

  <!-- Tech Stack -->
  <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />

  <!-- Deploy -->
<a href="https://arithvoid.deathknight.me/">
  <img src="https://img.shields.io/badge/Live%20App-Visit-success?style=for-the-badge" />
</a>

  <!-- License -->
  <img src="https://img.shields.io/github/license/your-username/arithvoid?style=for-the-badge" />

</p>

---

## ✨ Features

- 🔐 Secure authentication with Supabase Auth  
- 📁 Upload & download files (ZIP, PDF, images)  
- 👥 Group-based file sharing  
- ⏳ Auto-delete files after 7 days  
- 🎨 Modern glassmorphism UI  
- 🔒 Row Level Security (RLS)  

---

## 🛠️ Tech Stack

- Frontend: Next.js (App Router)  
- Backend: Supabase  
- Database: PostgreSQL  
- Storage: Supabase Storage  
- Styling: Tailwind CSS  

---

## 📸 Preview

<!-- Add screenshots here -->
<!-- ![Dashboard](./public/dashboard.png) -->

---

## 📂 Project Structure

/app  
  /dashboard  
  /groups  
  /login  
  /api  

/components  
/lib/supabase  

---

## ⚙️ Environment Variables

Create a `.env.local` file:

NEXT_PUBLIC_SUPABASE_URL=your_project_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  

---

## 🚀 Getting Started

### Clone the repository
git clone https://github.com/your-username/arithvoid.git  
cd arithvoid  

### Install dependencies
npm install  

### Run development server
npm run dev  

---

## 🔐 Supabase Setup

1. Create a Supabase project  
2. Enable Authentication  
3. Create a storage bucket (`files`)  
4. Configure Row Level Security (RLS)  

---

## 📌 Core Functionality

### File Upload Flow
- Upload file → Stored in Supabase  
- Metadata saved in DB  
- Expiry set (7 days)  

### Auto Delete System
- Scheduled job deletes expired files  

---

## 🧠 Future Improvements

- Drag & drop uploads  
- Public shareable links  
- Storage analytics  
- Mobile optimization  
- Notifications  

---

## 🤝 Contributing

Fork → Clone → Branch → Commit → Push → PR  

---

## 📄 License

MIT License  

---

## 🔎 SEO Keywords

file sharing platform, secure file upload, Next.js storage app, Supabase file storage, team file sharing, temporary file hosting
