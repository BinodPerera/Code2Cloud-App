import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Code2, Cloud, FileCode2 } from 'lucide-react';

function Services() {
  const navigate = useNavigate();

  const services = [
    {
      id: 'finops',
      title: 'Cost Analysis (FinOps)',
      description: 'Analyze your current cloud infrastructure costs and get AI-driven optimization recommendations.',
      icon: Calculator,
      color: '#059669',
      bgHover: 'rgba(5, 150, 105, 0.08)',
      borderHover: 'rgba(5, 150, 105, 0.4)'
    },
    {
      id: 'docker',
      title: 'Docker Generation',
      description: 'Automatically generate optimal Dockerfiles and compose setups tailored for your repository.',
      icon: Code2,
      color: '#34d399',
      bgHover: 'rgba(52, 211, 153, 0.08)',
      borderHover: 'rgba(52, 211, 153, 0.4)'
    },
    {
      id: 'terraform_script',
      title: 'Terraform Script Generation',
      description: 'Generate production-ready Infrastructure as Code (IaC) Terraform scripts without automated deployment workflows.',
      icon: FileCode2,
      color: '#10B981',
      bgHover: 'rgba(16, 185, 129, 0.08)',
      borderHover: 'rgba(16, 185, 129, 0.4)'
    },
    {
      id: 'cloud_deploy',
      title: 'Cloud Deployment',
      description: 'Deploy your application directly to the cloud with automated Terraform provisioning, CI/CD pipelines, and secrets management.',
      icon: Cloud,
      color: '#06b6d4',
      bgHover: 'rgba(6, 182, 212, 0.08)',
      borderHover: 'rgba(6, 182, 212, 0.4)'
    }
  ];

  const handleServiceSelect = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  return (
    <>
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '700', letterSpacing: '-1px', background: 'linear-gradient(90deg, #fff, var(--c2c-text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          What would you like to build today?
        </h2>
        <p style={{ color: 'var(--c2c-text-secondary)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Select a service below to begin your path to the cloud. We'll analyze your code and get you set up perfectly.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', alignItems: 'stretch' }}>
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => handleServiceSelect(service.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: 'var(--c2c-surface)',
              border: '2px solid var(--c2c-border)',
              borderRadius: '24px',
              padding: '2.25rem 1.85rem',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = service.bgHover;
              e.currentTarget.style.borderColor = service.borderHover;
              e.currentTarget.style.boxShadow = `0 20px 40px -10px ${service.bgHover}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--c2c-surface)';
              e.currentTarget.style.borderColor = 'var(--c2c-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: `${service.color}18`,
              border: `2px solid ${service.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.75rem', flexShrink: 0, color: service.color,
              boxShadow: `0 8px 24px -6px ${service.color}35`
            }}>
              <service.icon size={30} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '600', margin: '0 0 0.85rem 0', color: 'var(--c2c-text-primary)' }}>
              {service.title}
            </h3>

            <p style={{ color: 'var(--c2c-text-secondary)', fontSize: '0.98rem', lineHeight: '1.65', margin: 0, flexGrow: 1 }}>
              {service.description}
            </p>

            <div style={{
              marginTop: '1.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: service.color,
              color: '#0a0d14',
              padding: '0.6rem 1.5rem',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              width: 'fit-content'
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
