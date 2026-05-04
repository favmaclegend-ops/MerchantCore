

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement, // Required for the dots
    LineElement,  // Required for the line
    Title,
    Tooltip,
    Legend,
    ChartData,
    ChartOptions
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
