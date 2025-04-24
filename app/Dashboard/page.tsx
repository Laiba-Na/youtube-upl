"use client";  // Ensure it's a client component

import CircularProgress from "@/components/CircularProgress";
import Sidebar from "@/components/sideBar";
import WeeklySchedule from "@/components/WeeklySchedule";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import imageGradient from '../round.jpg';
import TopBar from "@/components/TopBar";


const data = [
  { year: "2004", value: 30 },
  { year: "2005", value: 50 },
  { year: "2006", value: 90 },
  { year: "2007", value: 70 },
  { year: "2008", value: 80 },
  { year: "2009", value: 40 },
];

export default function PostEditing() {
  return (
<div>
  <TopBar/>

    <div className="grid grid-cols-5 w-full bg-white">
      
      {/* Sidebar */}
      <div className="col-span-1">
      <Sidebar/>
      </div>

      {/* Main Content */}
      <main className=" col-span-4 grid grid-rows-2 grid-cols-1 bg-white">
        {/* Graph and side circle */}
        <div className=" row-span-1 grid grid-cols-6 grid-rows-1 gap-x-1 pl-10 pr-5 bg-primaryRed/20 place-items-center">
        <div className="col-span-1"><CircularProgress
        value={244}
        maxValue={300}
        label="Lorem ipsum"
        bottomText="LOREM IPSUM"
      /></div>
      {/* Graph */}
        
          <ResponsiveContainer width="100%" height={200} className="col-span-5">
            <LineChart data={data}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#E63946" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        
        </div>

        <div className=" pl-16 pr-16  place-content-center flex justify-between place-items-center row-span-1 col-span-1 mt-8">
          {/* Gradient SVG */}
          <div className="w-80 relative">
          <img src={imageGradient.src} alt="Round graphic" className="object-cover" /> 
          
            
          </div>

          {/* Mini Schedule */}
          <div>
           <WeeklySchedule/>
          </div>
        </div>
      </main>
    </div>
    </div>
  );
}
