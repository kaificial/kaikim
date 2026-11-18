"use client";

import Webring from '../components/Webring';
import { Hero } from '../components/home/Hero';
import { Experience } from '../components/home/Experience';
import { Skills } from '../components/home/Skills';
import { FeaturedProjects } from '../components/home/FeaturedProjects';
import { ContributionStrip } from '../components/home/ContributionStrip';

export default function Home() {
    return (
        <div className="w-full homepage-text-reveal">
            <Hero />
            {/* sections the command palette can jump to */}
            <div data-page-section="Experience"><Experience /></div>
            <div data-page-section="Projects"><FeaturedProjects /></div>
            <div data-page-section="Skills"><Skills /></div>
            <div data-page-section="GitHub"><ContributionStrip username="kaificial" /></div>

            {/* Blank Footer Space */}
            <div style={{ height: '12px' }} />
            <div data-page-section="Webring"><Webring /></div>
            <div className="footer-spacer" />
        </div>
    );
}
