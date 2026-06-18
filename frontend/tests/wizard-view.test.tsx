import { render, screen } from '@testing-library/react';
import { WizardView } from '@/views/WizardView';

describe('WizardView', () => {
  const steps = [
    { label: 'Step A', description: 'A desc', status: 'completed' as const },
    { label: 'Step B', description: 'B desc', status: 'current' as const },
    { label: 'Step C', description: 'C desc', status: 'upcoming' as const },
  ];

  it('renders step chips and current step header', () => {
    render(
      <WizardView title="Wizard" description="Flow" steps={steps}>
        <div>Body Content</div>
      </WizardView>,
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step A')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Step B')).toBeInTheDocument();
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('renders optional summary and footer slots', () => {
    render(
      <WizardView
        title="Wizard"
        description="Flow"
        steps={steps}
        summary={<div>Summary Block</div>}
        footer={<button type="button">Next Step</button>}
      >
        <div>Body</div>
      </WizardView>,
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Summary Block')).toBeInTheDocument();
    expect(screen.getByText('Next Step')).toBeInTheDocument();
  });

  it('has responsive structural classes for wizard layout', () => {
    const { container, rerender } = render(
      <WizardView title="Wizard" description="Flow" steps={steps}>
        <div>Body</div>
      </WizardView>,
    );

    expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument();
    const fullWidthLayout = container.querySelector('div[class*="lg:grid-cols-"]');
    expect(fullWidthLayout).toBeInTheDocument();
    expect(fullWidthLayout?.className).toContain('lg:grid-cols-1');

    rerender(
      <WizardView title="Wizard" description="Flow" steps={steps} summary={<div>Summary Block</div>}>
        <div>Body</div>
      </WizardView>,
    );
    const summaryLayout = container.querySelector('div[class*="lg:grid-cols-[minmax"]');
    expect(summaryLayout).toBeInTheDocument();
    expect(summaryLayout?.className).toContain('lg:grid-cols-[minmax(0,1fr)_20rem]');
  });
});
