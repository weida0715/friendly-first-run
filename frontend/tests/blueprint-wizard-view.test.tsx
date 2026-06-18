import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BlueprintWizardView } from '@/views/BlueprintWizardView';
import { ApiClientError } from '@/lib/api/client';

const pushMock = jest.fn();
const createBlueprintMock = jest.fn();
const getBlueprintMetadataMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return {
    ...actual,
    createBlueprint: (...args: unknown[]) => createBlueprintMock(...args),
    getBlueprintMetadata: (...args: unknown[]) => getBlueprintMetadataMock(...args),
  };
});

describe('BlueprintWizardView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBlueprintMetadataMock.mockResolvedValue({
      ok: true,
      data: {
        indicators: [
          {
            name: 'vwap',
            displayName: 'VWAP',
            source: 'custom',
            outputColumns: ['vwap'],
            parameterConstraints: {},
          },
          {
            name: 'ichimoku_cloud',
            displayName: 'Ichimoku Cloud',
            source: 'custom',
            outputColumns: ['ichimoku_conversion'],
            parameterConstraints: {
              conversion_period: { default: 9, type: 'integer', min: 1 },
              base_period: { default: 26, type: 'integer', min: 1 },
              mode: { default: 'fast', type: 'string', allowed_values: ['fast', 'slow'] },
            },
          },
        ],
      },
    });
  });

  it('supports step navigation', () => {
    render(<BlueprintWizardView />);

    expect(screen.getByText(/Step 1: Basics/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), {
      target: { value: 'Nav BP' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/Step 2: Architecture/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/Step 1: Basics/i)).toBeInTheDocument();
  });

  it('renders review summary on step 4', () => {
    render(<BlueprintWizardView />);

    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), {
      target: { value: 'My BP' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/Blueprint Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Permutations/i)).toBeInTheDocument();
    expect(screen.getByText(/Chosen Indicators and Parameters/i)).toBeInTheDocument();
  });

  it('shows validation error in UI when step is invalid', () => {
    render(<BlueprintWizardView />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('Blueprint name is required.')).toBeInTheDocument();
    expect(screen.getByText('Please fix the highlighted fields before continuing.')).toBeInTheDocument();
  });

  it('submits on create and navigates to detail path', async () => {
    createBlueprintMock.mockResolvedValue({
      ok: true,
      data: { blueprint: { id: 11, detailPath: '/blueprints/11' } },
    });

    render(<BlueprintWizardView />);
    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), { target: { value: 'Live BP' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /create blueprint/i }));

    expect(await screen.findByText(/Creating.../i)).toBeInTheDocument();
    await Promise.resolve();
    expect(pushMock).toHaveBeenCalledWith('/blueprints/11');
  });

  it('shows backend validation error when API rejects', async () => {
    createBlueprintMock.mockRejectedValue(
      new ApiClientError('Validation failed', 400, {
        data: { errors: { 'metadata.name': 'Blueprint name is required.' } },
      }),
    );

    render(<BlueprintWizardView />);
    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), { target: { value: 'Error BP' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByRole('button', { name: /create blueprint/i }));

    expect(await screen.findByText('Please fix the highlighted validation errors and try again.')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('uses metadata-backed indicator constraints in the indicator step', async () => {
    render(<BlueprintWizardView />);

    await waitFor(() => expect(getBlueprintMetadataMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), { target: { value: 'Metadata BP' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/Custom Indicators/i)).toBeInTheDocument();
    const ichimokuCard = screen.getByText(/Ichimoku Cloud/i).closest('div')?.parentElement?.parentElement;
    expect(ichimokuCard).toBeTruthy();
    fireEvent.click(ichimokuCard!.querySelector('input[type="checkbox"]') as HTMLInputElement);
    await waitFor(() => expect(screen.getAllByText('min 1').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: /remove 9/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove 26/i })).toBeInTheDocument();
  });

  it('turns continuous indicator input into removable token boxes on space', async () => {
    render(<BlueprintWizardView />);

    await waitFor(() => expect(getBlueprintMetadataMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), { target: { value: 'Token BP' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    const ichimokuCard = screen.getByText(/Ichimoku Cloud/i).closest('div')?.parentElement?.parentElement;
    fireEvent.click(ichimokuCard!.querySelector('input[type="checkbox"]') as HTMLInputElement);
    await waitFor(() => expect(screen.getByLabelText('mode options')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /remove 9/i }));
    const input = screen.getByLabelText('conversion_period value');
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.keyDown(input, { key: ' ' });

    expect(screen.getByRole('button', { name: /remove 12/i })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: ' ' });
    expect(screen.getByRole('alert')).toHaveTextContent('Value must be >= 1.');
  });

  it('uses unique dropdown token boxes for discrete indicator parameters', async () => {
    render(<BlueprintWizardView />);

    await waitFor(() => expect(getBlueprintMetadataMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), { target: { value: 'Discrete BP' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    const ichimokuCard = screen.getByText(/Ichimoku Cloud/i).closest('div')?.parentElement?.parentElement;
    fireEvent.click(ichimokuCard!.querySelector('input[type="checkbox"]') as HTMLInputElement);
    const dropdown = await screen.findByLabelText('mode options');
    fireEvent.change(dropdown, { target: { value: 'slow' } });

    expect(screen.getByRole('button', { name: /remove fast/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove slow/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'slow' })).toBeDisabled();
  });

  it('validates architecture parameters as numeric csv input', () => {
    render(<BlueprintWizardView />);

    fireEvent.change(screen.getByLabelText(/Blueprint Name/i), { target: { value: 'Arch Validation BP' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(screen.getByText(/Logistic Regressor/i));
    const input = screen.getByLabelText('C value');
    fireEvent.click(screen.getByRole('button', { name: /remove 1/i }));
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText('Value must be numeric.')).toBeInTheDocument();
  });
});
