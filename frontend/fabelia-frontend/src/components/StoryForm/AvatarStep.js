import { StepProps } from "./types";

export const AvatarStep = ({ data, onUpdate, onNext }) => {
  const handleSelect = (avatar) => {
    onUpdate("avatar", avatar);
    setTimeout(onNext, 300);
  };

  // Placeholder avatars based on gender
  const avatars = data.gender === 'boy' ? [
    { src: '/images/male1.webp', name: 'Äventyraren' },
    { src: '/images/male2.webp', name: 'Utforskaren' },
    { src: '/images/male3.webp', name: 'Hjälten' },
    { src: '/images/male4.webp', name: 'Filosofen' },
    { src: '/images/male5.webp', name: 'Upptäckaren' },
    { src: '/images/male6.webp', name: 'Tänkaren' },
    { src: '/images/male7.webp', name: 'Kämpen' },
    { src: '/images/male8.webp', name: 'Drömmaren' },
  ] : [
    { src: '/images/female1.webp', name: 'Prinsessan' },
    { src: '/images/female2.webp', name: 'Äventyraren' },
    { src: '/images/female3.webp', name: 'Hjälten' },
    { src: '/images/female4.webp', name: 'Upptäckaren' },
    { src: '/images/female5.webp', name: 'Filosofen' },
    { src: '/images/female6.webp', name: 'Utforskaren' },
    { src: '/images/female7.webp', name: 'Kämpen' },
    { src: '/images/female8.webp', name: 'Drömmaren' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-center mb-8">
        Välj en avatar för {data.childName}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {avatars.map((avatar, index) => (
          <div
            key={index}
            className={`relative aspect-square ${
              data.avatar === avatar.src ? "border-4 border-blue-500" : "border-2 border-gray-300"
            } rounded-lg cursor-pointer transition-transform transform hover:scale-105`}
            onClick={() => handleSelect(avatar.src)}
          >
            <img
              src={avatar.src}
              alt={avatar.name}
              className="w-full h-full object-cover rounded-lg"
            />
            <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 rounded px-2">
              {avatar.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
