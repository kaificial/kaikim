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
            {/* sections the command palette can jump to */}
            <div data-page-section="Experience"><Experience /></div>
            <div data-page-section="Education"><Education /></div>
            <div data-page-section="Projects"><FeaturedProjects /></div>
            <div data-page-section="Skills"><Skills /></div>

            {/* GitHub Activity */}
            <section style={{ marginTop: '32px' }} data-page-section="Activity">
                <div data-scroll-fx>
                    <GitHubActivity username="kaificial" />
                </div>
            </section>

            {/* Blank Footer Space */}
            <div style={{ height: '12px' }} />
            <div data-page-section="Webring"><Webring /></div>
            <div className="footer-spacer" />
        </div>
    );
}
