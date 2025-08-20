import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { ArrowRightIcon, GraduationCapIcon, ChatBubbleIcon, UsersIcon, SparklesIcon } from '../assets/icons';
import { APP_NAME } from '../constants';
import { useTypedText } from '../hooks/useTypedText';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const typedHeadlines = useTypedText(
    [
      "Empowering Rwanda's Future Leaders",
      "A Unified Digital Campus",
      "Connecting Students and Teachers",
      "Engaging Parents in Education",
    ],
    120, 
    60,  
    2500 
  );

  return (
    <div className="bg-white dark:bg-dark-secondary text-secondary-700 dark:text-dark-text min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-white bg-cover bg-center" style={{ backgroundImage: "linear-gradient(rgba(29, 78, 216, 0.5), rgba(30, 64, 175, 0.7)), url('https://placehold.co/1920x1080/0e7490/e0f2fe?text=Rwandan+Students+Learning')" }}>
        <div className="text-center p-4 animate-fadeIn">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight min-h-[80px] md:min-h-[140px]" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.6)'}}>
            {typedHeadlines}
            <span className="animate-ping">|</span>
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-slate-200" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.7)'}}>
            A comprehensive platform for students, teachers, and parents to collaborate for a brighter educational journey.
          </p>
          <Button onClick={() => navigate('/select-role')} size="lg" className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-xl" rightIcon={<ArrowRightIcon className="w-5 h-5"/>}>
            Login to your Work Management
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-secondary-100 dark:bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white">A Unified Digital Campus</h3>
            <p className="text-secondary-600 dark:text-secondary-300 mt-2">Everything you need, all in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-xl transition-shadow animate-cardEntry">
              <div className="inline-block p-4 bg-primary-100 dark:bg-primary-800 rounded-full mb-4">
                <GraduationCapIcon className="w-10 h-10 text-primary-600 dark:text-primary-300" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-secondary-800 dark:text-white">Academic Excellence</h4>
              <p className="text-secondary-600 dark:text-secondary-300">Track grades, access resources, manage exams, and plan lessons with powerful AI-assisted tools.</p>
            </div>
            <div className="text-center p-8 bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-xl transition-shadow animate-cardEntry" style={{animationDelay: '200ms'}}>
              <div className="inline-block p-4 bg-green-100 dark:bg-green-800 rounded-full mb-4">
                <ChatBubbleIcon className="w-10 h-10 text-green-600 dark:text-green-300" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-secondary-800 dark:text-white">Seamless Communication</h4>
              <p className="text-secondary-600 dark:text-secondary-300">Connect instantly through integrated chat, video calls, and school-wide announcements.</p>
            </div>
            <div className="text-center p-8 bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-xl transition-shadow animate-cardEntry" style={{animationDelay: '400ms'}}>
              <div className="inline-block p-4 bg-yellow-100 dark:bg-yellow-800 rounded-full mb-4">
                <UsersIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-300" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-secondary-800 dark:text-white">Total Engagement</h4>
              <p className="text-secondary-600 dark:text-secondary-300">Empower parents with real-time insights into their child's progress, attendance, and school life.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-dark-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white">Voices from Our Community</h3>
            <p className="text-secondary-600 dark:text-secondary-300 mt-2">Hear what students, parents, and teachers have to say.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-secondary-100 dark:bg-dark-secondary rounded-lg shadow animate-cardEntry">
              <p className="italic text-secondary-600 dark:text-secondary-300">"This portal has transformed how I manage my studies. The AI helper is a game-changer for my homework!"</p>
              <p className="mt-4 font-semibold text-secondary-800 dark:text-white">- A. Keza</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Student, Grade 11</p>
            </div>
             <div className="p-8 bg-secondary-100 dark:bg-dark-secondary rounded-lg shadow animate-cardEntry" style={{animationDelay: '200ms'}}>
              <p className="italic text-secondary-600 dark:text-secondary-300">"As a parent, being able to track my child's attendance and grades in real-time gives me complete peace of mind."</p>
              <p className="mt-4 font-semibold text-secondary-800 dark:text-white">- M. Uwase</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Parent, Grade 8</p>
            </div>
             <div className="p-8 bg-secondary-100 dark:bg-dark-secondary rounded-lg shadow animate-cardEntry" style={{animationDelay: '400ms'}}>
              <p className="italic text-secondary-600 dark:text-secondary-300">"The lesson planner saves me hours of work every week. It's an incredible tool for educators."</p>
              <p className="mt-4 font-semibold text-secondary-800 dark:text-white">- J. Mugisha</p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Teacher, Mathematics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News & Events Section */}
      <section className="py-16 md:py-24 bg-secondary-100 dark:bg-dark-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white">Latest News & Events</h3>
            <p className="text-secondary-600 dark:text-secondary-300 mt-2">Stay updated with the latest happenings at our school.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform animate-cardEntry">
              <img src="https://placehold.co/600x400/34d399/1f2937?text=Science+Fair" alt="Science Fair" className="w-full h-48 object-cover"/>
              <div className="p-6">
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Oct 28, 2024</p>
                <h4 className="text-lg font-semibold mb-2 text-secondary-800 dark:text-white">Annual Science Fair Winners Announced</h4>
                <p className="text-sm text-secondary-600 dark:text-secondary-300">Congratulations to all participants for their innovative projects and groundbreaking ideas.</p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform animate-cardEntry" style={{animationDelay: '200ms'}}>
              <img src="https://placehold.co/600x400/60a5fa/1f2937?text=Sports+Gala" alt="Sports Gala" className="w-full h-48 object-cover"/>
              <div className="p-6">
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Nov 15, 2024</p>
                <h4 className="text-lg font-semibold mb-2 text-secondary-800 dark:text-white">Upcoming Inter-School Sports Gala</h4>
                <p className="text-sm text-secondary-600 dark:text-secondary-300">Get ready to cheer for our teams as they compete for the championship trophy next month.</p>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform animate-cardEntry" style={{animationDelay: '400ms'}}>
              <img src="https://placehold.co/600x400/c084fc/1f2937?text=Parent-Teacher+Meeting" alt="Parent-Teacher Meeting" className="w-full h-48 object-cover"/>
              <div className="p-6">
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">Nov 22, 2024</p>
                <h4 className="text-lg font-semibold mb-2 text-secondary-800 dark:text-white">Parent-Teacher Meetings Scheduled</h4>
                <p className="text-sm text-secondary-600 dark:text-secondary-300">Please log in to the portal to book your slot for the end-of-term parent-teacher meetings.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-primary-600 dark:bg-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
            <SparklesIcon className="w-12 h-12 text-yellow-300 mx-auto mb-4"/>
            <h3 className="text-3xl md:text-4xl font-bold">Join Our Digital Campus Today</h3>
            <p className="mt-2 mb-8 max-w-2xl mx-auto text-primary-200">
                Take the next step in fostering a collaborative and modern educational experience.
            </p>
            <Button onClick={() => navigate('/select-role')} size="lg" className="bg-white text-primary-600 hover:bg-slate-200 shadow-xl" rightIcon={<ArrowRightIcon className="w-5 h-5"/>}>
                Login to your Work Management
            </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-800 dark:bg-dark-secondary text-secondary-300 py-8">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p className="text-xs mt-1">Made with ❤️ for the future of Rwanda.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
