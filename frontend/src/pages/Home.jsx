// Renders the landing page with the project introduction and entry options.
import { useEffect } from "react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { getAuth } from "../lib/auth";

// Render the landing page and guide users to the main portal sections.
export default function Home() {
  const auth = getAuth();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add("college-theme");
    return () => document.body.classList.remove("college-theme");
  }, []);

  useEffect(() => {
    if (location.hash === "#about") {
      window.requestAnimationFrame(() => {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", "/");
        }
      });
      return;
    }
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [location.pathname, location.hash]);

  return (
    <div className="container home-page-flow home-page-footer-flush" style={{ paddingTop: 18 }}>
      <header className="topbar">
        <div className="brand">
          <div className="logoCircle">
            <img className="logoImg" src={new URL("../assets/cpmslogo.png", import.meta.url).href} alt="College Logo" />
          </div>
          <div className="brandText">
            <div className="brandName" id="new">COLLEGE PLACEMENT MANAGEMENT SYSTEM</div>
            <div className="brandTag">From classroom to career, your journey starts here.</div>
          </div>
        </div>
        <nav className="topnav" />
      </header>

      <section id="home" className="homeHero">
        <div className="homeHeroInner">
          <h1 id="new2">Build your career with campus opportunities ...</h1>
          <p>
            Apply for jobs, register for drives, track interviews, and view placement updates -
            all in one system.
          </p>

          <div className="homeCtas">
            <Link className="btn" to="/jobs">Explore Jobs</Link>
            <Link className="btn" to="/drives">Upcoming Drives</Link>
            <Link className="btn" to="/placements">Placements</Link>
          </div>

          {auth?.token ? (
            <div style={{ marginTop: 10 }}>
              <span className="pill">You are logged in as <b>{String(auth.role || "").toUpperCase()}</b></span>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <span className="pill">Login to access dashboards</span>
            </div>
          )}
        </div>
      </section>

      <section className="homeGrid homeAboutGrid">
        <div className="infoCard aboutFullCard" id="about">
          <span className="aboutEyebrow">About Us</span>
          <h3 id="new3">Designed to make campus placements organized, transparent, and career-focused</h3>
          <p>
            College Placement Management System is a dedicated digital platform for handling the complete placement process inside a college environment. It connects students, the Training and Placement Office, and recruiters through one structured system where opportunities, communication, and progress are managed clearly.
          </p>

          <div className="aboutHighlights">
            <div className="aboutHighlightCard">
              <strong>Student Experience</strong>
              <p>Students can create profiles, explore jobs and drives, view notices, track interviews, and stay updated throughout their placement journey from one dashboard.</p>
            </div>
            <div className="aboutHighlightCard">
              <strong>TPO Workflow</strong>
              <p>The TPO can manage student records, publish opportunities, approve data, coordinate drives, and monitor placement activity with better visibility and control.</p>
            </div>
            <div className="aboutHighlightCard">
              <strong>Institutional Value</strong>
              <p>By reducing manual work and centralizing updates, CPMS helps colleges run a smoother, more professional, and more reliable placement process.</p>
            </div>
          </div>

          <p>
            The goal of CPMS is not only to manage placement data, but to support real student outcomes. It creates a strong bridge between academic learning and career opportunities, helping campuses build a placement environment that is efficient, accessible, and future-ready.
          </p>
        </div>
      </section>

      <footer className="footer home-footer" style={{ background: "#000000", color: "#ffffff", borderColor: "#000000" }}>
        <div className="home-footer-inner">
          <div className="home-footer-grid">
            <div className="home-footer-brand">
              <div className="home-footer-title">College Placement Management System</div>
              <span className="home-footer-tagline">Connecting opportunity, preparation, and placement success.</span>
              <span className="home-footer-subtagline">Professional placement operations for modern campuses</span>
            </div>

            <div className="home-footer-section">
              <strong>Quick Links</strong>
              <Link to="/jobs">Jobs</Link>
              <Link to="/drives">Drives</Link>
              <Link to="/placements">Placements</Link>
              <a href="/#about">About Us</a>
            </div>

            <div className="home-footer-section">
              <strong>Placement Cell</strong>
              <span>Email: placementcell@college.edu</span>
              <span>Office Hours: Mon - Fri, 9:00 AM - 5:00 PM</span>
              <span>Support for students, TPO, and placement updates</span>
            </div>
          </div>

          <div className="home-footer-bottom">
            <span>(c) {new Date().getFullYear()} College Placement Management System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
