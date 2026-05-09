import './HomePage.css'
import Slideshow from './Componenets/Slideshow';

function HomePage() {
  return (
    <div className="home">
      <Slideshow />

      <section className="about-section">
        <h2>About <span className="highlight">msf</span></h2>
        <p>
          The mission being carried out by the <span className="highlight">Cheekode Panchayath Committee </span> of the Muslim Students Federation,
          which is entering its 65th year in Malayalam, is being praised by everyone.
          The msf movement, which is leading the struggle for students' rights, providing a helping hand
          to helpless students, and leading educational activities, is a proud journey.
        </p>
      </section>
    </div>
  );
}

export default HomePage;
