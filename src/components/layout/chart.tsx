

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement, // Required for the dots
    LineElement,  // Required for the line
    Title,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions
} from 'chart.js';

import { Line } from 'react-chartjs-2'; // Import Line instead of Bar

// Register the line-specific components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


// Specify 'line' in the generic type for better Autocomplete
const data: ChartData<'line'> = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    datasets: [
        {
            label: 'Steps Walked',
            data: [3000, 5000, 4500, 7000],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.3, // Adds a slight curve to the line
        },
    ],
};

const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top' as const,
        },
    },
};

export default function DLineChart() {
    return <Line data={data} options={options} />;
}
