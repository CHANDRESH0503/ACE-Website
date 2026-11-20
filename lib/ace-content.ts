// Shared, factual club content. Used by the landing page and the clusters page.

export interface Cluster {
  title: string;
  description: string;
  imageUrl: string;
}

export interface SocialLink {
  name: string;
  url: string;
}

export interface TeamMember {
  imageUrl?: string;
  /** Optional focal point and zoom. Team photos in /images/team are already cropped to one shared framing. */
  focus?: { x: number; y: number; zoom: number };
  firstName: string;
  lastName: string;
  positions: string[];
  socialNetworks: SocialLink[];
}

export interface FAQ {
  question: string;
  answer: string;
  value: string;
}

export const mission = [
  {
    title: "Inspiring Innovation",
    description:
      "Sparking creativity and innovation by providing a space to explore new technologies and solve real-world problems.",
  },
  {
    title: "Supporting Collaboration",
    description:
      "Fostering collaboration by connecting students with peers, faculty, and industry professionals to share ideas and work together.",
  },
  {
    title: "Encouraging Excellence",
    description:
      "Promoting excellence in computing through events, workshops, and seminars designed to build skills, knowledge, and careers.",
  },
  {
    title: "Research Advancement",
    description:
      "Encouraging research by connecting members with SoC faculty and researchers for publications and collaborations.",
  },
];

export const principles = [
  {
    title: "Innovation",
    description:
      "We believe in fostering a culture of innovation by encouraging creative thinking, problem-solving, and the exploration of new ideas in the field of computing.",
  },
  {
    title: "Excellence",
    description:
      "Our commitment to excellence drives us to strive for the highest standards of quality in all our endeavors, whether it's organizing events, hackathons, webinars, or any other activities.",
  },
  {
    title: "Collaboration",
    description:
      "We value collaboration and teamwork, recognizing that collective effort and diverse perspectives lead to greater success and innovation.",
  },
  {
    title: "Education",
    description:
      "ACE is dedicated to promoting continuous learning and skill development among its members, providing opportunities for growth and advancement in the ever-evolving field of computing.",
  },
  {
    title: "Community",
    description:
      "We are committed to building a strong and supportive community of computing enthusiasts, where members can connect, share knowledge, and inspire each other to achieve their goals.",
  },
  {
    title: "Transparency",
    description:
      "We believe in transparency and open communication, ensuring that our members are informed about our activities, decisions, and initiatives.",
  },
];

export const clusters: Cluster[] = [
    {
        imageUrl: '/images/Clusters/WD.png',
        title: 'Web Development',
        description:
            'Dive into the world of web development by building dynamic and responsive websites. Enhance your skills in both front-end and back-end technologies while working on impactful projects that elevate ACE’s online presence.',
         
    },
    {
        imageUrl: '/images/Clusters/AD.png',
        title: 'App Development',
        description:
            'Join the app development sub-cluster to create innovative mobile applications. Gain hands-on experience in designing and developing apps that solve real-world problems and contribute to ACE’s digital ecosystem.',
        
    },
    {
        imageUrl: '/images/Clusters/AIML.png',
        title: 'AI ML',
        description:
            'Members will delve into the world of AI and ML, working on projects that involve data analysis, machine learning models, and AI applications. They will stay updated with the latest trends and advancements in the field.',
       
    },
    {
        imageUrl: '/images/Clusters/cyber.png',
        title: 'Cybersecurity',
        description:
            'This sub-cluster is dedicated to understanding and implementing security measures to protect information systems. Members will learn about various cybersecurity practices, ethical hacking, and how to safeguard against cyber threats.',
        
       
    },
    {
        imageUrl: '/images/Clusters/Iot.png',
        title: 'IOT & Embedded Systems',
        description:
            'Members of this sub-cluster will explore the integration of hardware and software to build smart, connected systems. They will work on real-time data collection, sensor-based automation, and networked devices.',
      
    },
    {
        imageUrl: '/images/Clusters/CP.png',
        title: 'Competitive Programming',
        description:
            'Members will engage in competitive programming, solving complex problems and participating in coding competitions. This sub-cluster aims to enhance problem-solving skills and algorithmic thinking.',
        
    },
    {
        imageUrl: '/images/Clusters/GD.png',
        title: 'Graphic Designing',
        description:
            'This sub-cluster focuses on creating visually appealing graphics for posters and social media posts. Members will use their design skills to create engaging and informative visual content.',
       
    },
    {
        imageUrl: '/images/Clusters/video.png',
        title: 'Video Editing',
        description:
            'Members will be responsible for editing videos for various ACE events and promotional materials. They will use their editing skills to create professional and engaging video content.',
       
    },
    {
        imageUrl: '/images/Clusters/CW.png',
        title: 'Content Writing',
        description:
            "This sub-cluster focuses on writing content for various media, including blogs, social media posts, and promotional materials. Members will use their writing skills to convey ACE's message clearly and professionally.",
       
    },
    {
        imageUrl: '/images/Clusters/Opcon.png',
        title: 'OpCon & PR',
        description:
            'Members of this sub-cluster will ensure that all events and activities run smoothly. They will be responsible for the logistical aspects of events, ensuring that everything is well-organized and executed efficiently.',
        
    },{
       imageUrl: '/images/Clusters/Networks.png',
       title: 'Networks',
       description:'Every digital interaction begins with a connection. This cluster empowers members to understand, build, and optimize the networks that keep the world connected. From configuring infrastructure to securing communications, members will tackle real-world networking challenges with practical experience and innovation.'
      
    },
];

export const team: TeamMember[] = [
  {
    imageUrl: "/images/team/sruthi.jpg",
    firstName: "Sruthi Keerthi",
    lastName: "Mailari",
    positions: ["President"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/mailari-sruthi-keerthi-46a16a29a/",
      },
      {
        name: "GitHub",
        url: "https://github.com/SruthiKeerthi05",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/sk_killer__000",
      },
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=msruthi5505@gmail.com",
      },
    ],
  },
  {
    imageUrl: "/images/team/rasswanth.jpg",
    firstName: "Rasswanth",
    lastName: "GPN",
    positions: ["General Secretary"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/rasswanth-gpn-57a1b3273/",
      },
      {
        name: "Github",
        url: "https://github.com/ras-07",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/rasswanth__07",
      },
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=rasswanthgpn07@gmail.com",
      },
    ],
  },
  {
    imageUrl: "/images/team/someshwar.jpg",
    firstName: "Someshwar",
    lastName: "S",
    positions: ["Project Lead"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/soms36/",
      },
      {
        name: "Github",
        url: "https://github.com/soms36-DefSec/",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/somesh_36/",
      },
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=someshsuresh0306@gmail.com",
      },
    ],
  },
  {
    imageUrl: "/images/team/chandresh.jpg",
    firstName: "Chandresh",
    lastName: "J",
    positions: ["Technical Head"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/chandresh-j-8288302a8/",
      },
      {
        name: "Github",
        url: "https://github.com/CHANDRESH0503",
      },
    
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=jchandresh05@gmail.com",
      },
    ],
  },
  {
    imageUrl: "/images/team/palaniappan.jpg",
    firstName: "Palaniappan",
    lastName: "S",
    positions: ["Treasurer"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/coeuspalani",
      },
      {
        name: "Github",
        url: "https://github.com/coeuspalani",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/coeus_palani",
      },
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=palani232006@gmail.com",
      },
    ],
  },
  {
    imageUrl: "/images/team/pranathi.jpg",
    firstName: "Pranathi",
    lastName: "Kankati",
    positions: ["Creative Media Head"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/kankatipranathi-a9667a330/",
      },
      {
        name: "Github",
        url: "https://github.com/pranathikankati",
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/pranathiiii__03",
      },
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=pranathikankati0312@gmail.com",
      },
    ],
  },
  {
    imageUrl: "/images/team/rohith.jpg",
    firstName: "Rohith",
    lastName: "Jayaraman",
    positions: ["Organizing Secretary"],
    socialNetworks: [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/rohith-jayaraman-b-3b14a6300/",
      },
      {
        name: "Gmail",
        url: "https://mail.google.com/mail/?view=cm&to=rohithjayaramanb@gmail.com",
      },
    ],
  },
  ];

export const faqs: FAQ[] = [
  {
    question: "Who can join the Association of Computing Engineers?",
    answer: "ACE is open to 1st(only for non-tech cluster),2nd and 3rd year students enrolled in the School of Computing.",
    value: "item-1",
  },
  {
    question: "Do I need to have prior experience in computing to join ACE?",
    answer:
      "Not at all! ACE welcomes members from all levels of expertise, from beginners to advanced users. Our events and activities are designed to accommodate a diverse range of backgrounds and interests in computing.",
    value: "item-2",
  },
  {
    question:
      "What are the benefits of joining ACE?",
    answer:
      "By joining ACE, you will have access to a supportive community of peers who share your passion for computing. You will also have opportunities to network with industry professionals, enhance your skills and participate in hands-on learning experiences.",
    value: "item-3",
  },
  {
    question: "Can I be a part of more than one cluster?",
    answer: "Yes. If your eligibility proves that you can be a part of multiple clusters at a time then you are very much welcome. Make sure your work is spontaneous and on-time.",
    value: "item-4",
  },
  {
    question:
      "How often do ACE members meet?",
    answer: "Regular meetings are held, either weekly or once in 2 weeks. In case of upcoming events being planned, meetings become more often than usual. It can be both online and offline and all members are expected to attend the meeting without fail.",
    value: "item-5",
  },
  {
    question:
      "What activities will I be involved in as a member of the Technical Cluster?",
    answer: "Members organise and lead workshops and seminars, plan and execute hackathons, coding contests, contribute to ACE’s official website and research and provide content on any technical trends or developments for social media.",
    value: "item-6",
  },
  {
    question:
      "Are there opportunities for leadership within the clusters?",
    answer: "Certainly! The leaderships roles are assigned based on the members’ experience, contribution and interest. This can mark an outstanding place in your resume in future.",
    value: "item-7",
  },
  {
    question:
      "Can I suggest ideas for events or initiatives to ACE?",
    answer: "Yes. ACE values input from its members and welcomes suggestions. If you have an idea on organizing an event, the clusters will collaborate and work together for progress",
    value: "item-8",
  },
];
