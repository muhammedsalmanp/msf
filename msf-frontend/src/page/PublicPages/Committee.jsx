import { useEffect, useState, useRef } from 'react';
import './Committee.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/autoplay';
import axios from "../../api/axiosInstance";
import { FaUserTie, FaUserTag, FaMapMarkerAlt } from 'react-icons/fa'; // FaUsers removed as it's not used
import { useDispatch } from 'react-redux';
import { setLoading } from '../../Store/slices/loadingSlice'; // Assuming this is your loading slice

/**
 * MemberCard is updated slightly to show roles from 'main' OR 'haritha'
 */
const MemberCard = ({ member }) => {
  const roleTitles = member.roles
    // 👈 CHANGED: Now correctly shows Haritha roles as well
    .filter((r) => r.scope === 'main' || r.scope === 'haritha') 
    .map((r) => r.role?.title)
    .join(', ');

  return (
    <div className="w-64 rounded-2xl overflow-hidden shadow-lg bg-white relative transition-transform hover:scale-105">
      <div className="relative bg-gradient-to-tr from-pink-500 to-red-400 h-28 rounded-b-[70%]">
        <div className="absolute left-1/2 transform -translate-x-1/2 top-12 w-30 h-30">
          <img
            src={member.profileImage}
            alt={member.name}
            className="rounded-full border-4 border-white shadow-lg w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="mt-16 px-4 pb-5 text-center">
        <h3 className="text-sm font-semibold text-gray-800 flex flex-wrap items-center justify-center gap-1 w-full">
          <FaUserTie className="text-green-700" />
          {member.name}
        </h3>
        {member.unit?.name && (
          <p className="text-sm text-gray-700 mt-2 flex items-center justify-center gap-1">
            <FaMapMarkerAlt className="text-green-800" />
            {member.unit.name}
          </p>
        )}
        <p className="text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
          <FaUserTag className="text-green-800" />
          {roleTitles}
        </p>
      </div>
    </div>
  );
};

function Committee() {
  // 👈 CHANGED: We now have two separate states. 'members' is gone.
  const [msfMembers, setMsfMembers] = useState([]);
  const [harithaMembers, setHarithaMembers] = useState([]);
  
  const isMobile = window.innerWidth <= 768;
  const swiperRef = useRef(null); 
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCommittees = async () => {
      dispatch(setLoading(true)); // Start loading spinner
      try {
        // 👈 CHANGED: We fetch from two new, fast endpoints at the same time
        const [msfRes, harithaRes] = await Promise.all([
          axios.get("/user/main-committee"),   // Gets *only* MSF members
          axios.get("/user/haritha-committee") // Gets *only* Haritha members
        ]);
        
        setMsfMembers(msfRes.data);
        setHarithaMembers(harithaRes.data);
        
      } catch (err) {
        console.error('Error fetching committee members:', err);
      } finally {
        dispatch(setLoading(false)); // Stop loading spinner
      }
    };
    fetchCommittees();
  }, [dispatch]); // Add dispatch to dependency array

  // This render function is unchanged
  const renderGroup = (title, groupMembers) => {
    if (!groupMembers || groupMembers.length === 0) {
      return null;
    }

    return (
      <div className="committee-group">
        {title && (
          <h3 className="text-2xl font-semibold text-gray-800 text-center relative inline-block">
            {title}
            <span className="block w-16 h-1 bg-green-600 mx-auto mt-2 rounded-full"></span>
          </h3>
        )}

        <div className="committee-members">
          {isMobile ? (
            <Swiper
              effect="coverflow"
              grabCursor
              centeredSlides
              loop
              slidesPerView="auto"
              initialSlide={Math.floor(groupMembers.length / 2)}
              autoplay={{
                delay: 3000,
                disableOnInteraction: true,
                pauseOnMouseEnter: true,
              }}
              coverflowEffect={{
                rotate: 30, 
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true, 
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="swiper-container"
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
            >
              {groupMembers.map((member, i) => (
                <SwiperSlide key={i} className="swiper-slide">
                  <MemberCard member={member} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            groupMembers.map((member, i) => <MemberCard key={i} member={member} />)
          )}
        </div>
      </div>
    );
  };

  // 👈 DELETED: The slow client-side filtering is now gone!
  // const maleMembers = members.filter(...);
  // const femaleMembers = members.filter(...);

  // This helper function is still useful
  const findByRole = (memberList, roleTitle) => 
    memberList.find((m) => 
      m.roles.some((r) => (r.scope === "main" || r.scope === "haritha") && r.role?.title === roleTitle)
    );

  return (
    <section className="committee-container">
      <div className="committee-header">
        <div className="text-center my-6">
          <h2 className="text-3xl font-bold text-gray-800 relative inline-block">
            msf Cheekode Panchayat Committee
            <span className="block w-20 h-1 bg-green-600 mx-auto mt-2 rounded-full"></span>
          </h2>
          <p className="text-lg italic text-gray-600 tracking-wide mt-3">
            Leading with vision, unity, and service
          </p>
        </div>
      </div>

      <div className="mt-10">
        
        {/* 👈 CHANGED: We now pass the pre-filtered 'msfMembers' list */}
        {renderGroup('', [
          findByRole(msfMembers, "President"),
          findByRole(msfMembers, "Secretary"),
          findByRole(msfMembers, "Treasurer")
        ].filter(Boolean))} 

        {renderGroup('Vice Presidents', msfMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.includes("Vice President"))
        ))}
        {renderGroup('Joint Secretaries', msfMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.includes("Joint Secretary"))
        ))}
        {renderGroup('Wing', msfMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.includes("Wing"))
        ))}
        {renderGroup('Executive Members', msfMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.toLowerCase().includes("executive"))
        ))}
      </div>

      <div className="mt-16 mb-5">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-4">
          Haritha Cheekode Panchayat Committee
        </h2>

        {/* We are now passing the 'harithaMembers' list (which is 
          pre-filtered by the backend) and filtering it by 'scope: "main"'.
        */}
        {renderGroup('', [
          findByRole(harithaMembers, "President"),
          findByRole(harithaMembers, "Secretary"),
          findByRole(harithaMembers, "Treasurer")
        ].filter(Boolean))}

        {renderGroup('Vice Presidents', harithaMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.includes("Vice President"))
        ))}
        {renderGroup('Joint Secretaries', harithaMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.includes("Joint Secretary"))
        ))}
        {renderGroup('Wing', harithaMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.includes("Wing"))
        ))}
        {renderGroup('Executive Members', harithaMembers.filter((m) =>
          m.roles.some((r) => r.scope === "main" && r.role?.title?.toLowerCase().includes("executive"))
        ))}
      </div>
    </section>
  );
}

export default Committee;