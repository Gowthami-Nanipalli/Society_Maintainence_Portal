import { Box } from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../sections/Hero";
import About from "../sections/About";
import Amenities from "../sections/Amenities";
import Gallery from "../sections/Gallery";
import Location from "../sections/Location";
import Contact from "../sections/Contact";

export default function Home() {
  return (
    <Box>
      <Navbar />
      <Hero />
      <About />
      <Amenities />
      <Gallery />
      <Location />
      <Contact />
      <Footer />
    </Box>
  );
}
