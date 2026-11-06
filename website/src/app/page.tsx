"use client";

import Webring from '../components/Webring';
import { GitHubActivity } from '../components/GitHubActivity';
import { Hero } from '../components/home/Hero';
import { Experience } from '../components/home/Experience';
import { Education } from '../components/home/Education';
import { Skills } from '../components/home/Skills';
import { FeaturedProjects } from '../components/home/FeaturedProjects';

export default function Home() {
    return (
        <div className="w-full homepage-text-reveal">
            <Hero />
            <Experience />
            <Education />
            <FeaturedProjects />
            <Skills />

            {/* GitHub Activity */}
            <section style={{ marginTop: '32px' }}>
                <div data-scroll-fx>
                    <GitHubActivity username="kaificial" />
                </div>
            </section>

            {/* Blank Footer Space */}
            <div style={{ height: '12px' }} />
            <Webring />
            <div className="footer-spacer" />
        </div>
    );
}
