import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Code2, Cpu } from 'lucide-react';

function Services() {
  const navigate = useNavigate();

  const services = [
    {
      id: 'finops',
      title: 'Cost Analysis (FinOps)',
      description: 'Analyze your current cloud infrastructure costs and get AI-driven optimization recommendations.',
      icon: Calculator,
      color: '#00E5FF',
      bgHover: 'rgba(0, 229, 255, 0.1)',
      borderHover: 'rgba(0, 229, 255, 0.3)'
    },
    {
      id: 'docker',
      title: 'Docker Generation',
      description: 'Automatically generate optimal Dockerfiles and compose setups tailored for your repository.',
      icon: Code2,
      color: '#5865F2',
      bgHover: 'rgba(88, 101, 242, 0.1)',
      borderHover: 'rgba(88, 101, 242, 0.3)'
    },
    {
      id: 'terraform',
      title: 'Terraform Script Generation',
      description: 'Generate production-ready Infrastructure as Code (IaC) to securely deploy your application.',
      icon: Cpu,
      color: '#10B981',
      bgHover: 'rgba(16, 185, 129, 0.1)',
      borderHover: 'rgba(16, 185, 129, 0.3)'
    }
  ];

  const handleServiceSelect = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  return (
    <>
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '700', letterSpacing: '-1px', background: 'linear-gradient(90deg, #fff, #a2a2b5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          What would you like to build today?
        </h2>
        <p style={{ color: '#a2a2b5', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Select a service below to begin your path to the cloud. We'll analyze your code and get you set up perfectly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => handleServiceSelect(service.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.background = service.bgHover;
              e.currentTarget.style.borderColor = service.borderHover;
              e.currentTarget.style.boxShadow = `0 20px 40px -10px ${service.bgHover}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.0))`,
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '2rem', flexShrink: 0, color: service.color
            }}>
              <service.icon size={32} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 1rem 0', color: '#fff' }}>
              {service.title}
            </h3>

            <p style={{ color: '#a2a2b5', fontSize: '1.05rem', lineHeight: '1.7', margin: 0, flexGrow: 1 }}>
              {service.description}
            </p>

            <div style={{
              marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: service.color, fontSize: '1rem', fontWeight: '600'
            }}>
              Select Service →
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Services;
