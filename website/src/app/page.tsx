"use client";

import { motion } from 'framer-motion';
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
            <motion.section
                style={{ marginTop: '32px' }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
                <GitHubActivity username="kaificial" />
            </motion.section>

            {/* Blank Footer Space */}
            <div style={{ height: '12px' }} />
            <Webring />
            <div className="footer-spacer" />
        </div>
    );
}
