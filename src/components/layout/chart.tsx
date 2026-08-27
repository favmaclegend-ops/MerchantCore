
import { useEffect, useRef } from 'react';

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


export default function DLineChart({labels, datas, mobileHeight}: {labels: string[], datas: number[], mobileHeight?: string}) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = scrollRef.current
        if (el) {
            el.scrollTop = el.scrollHeight
            el.scrollLeft = 0
        }
    }, [labels, datas])

    // Specify 'line' in the generic type for better Autocomplete
    const data: ChartData<'line'> = {
        labels: labels,
        datasets: [
            {
                label: 'Revenue',
                data: datas,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.3, // Adds a slight curve to the line
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
    };

    const minWidth = Math.max(320, datas.length * 28)
    const scrollHeight = mobileHeight || 'min(600px, 65vh)'

    return (
        <div ref={scrollRef} style={{ height: scrollHeight, overflow: 'auto', scrollbarWidth: 'thin' }}>
            <div style={{ height: '500px', minWidth: `${minWidth}px`, width: '100%', position: 'relative' }}>
                <Line data={data} options={options} />
            </div>
        </div>
    );
}
