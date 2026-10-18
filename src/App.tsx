import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { QuickStart } from "./components/QuickStart";
import { Reel } from "./components/Reel";
import { Projects } from "./components/Projects";
import { About } from "./components/About";
import { Footer } from "./components/Footer";
import { NightSky } from "./components/NightSky";
import MusicPlayer from "./components/MusicPlayer";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <NightSky />
      <Header />
      <main id="conteudo">
        <Hero />
        <QuickStart />
        <div className="wave" aria-hidden="true" />
        <Reel />
        <div className="wave rotate-180" aria-hidden="true" />
        <Projects />
        <div className="wave" aria-hidden="true" />
        <About />
      </main>
      <Footer />
      <MusicPlayer />
    </>
  );
}
