import type { Route } from "./+types/home";
import Navbar from "../../Components/Navbar";
import {ArrowDown, ArrowRight, ArrowUpRight, Clock, Layers} from "lucide-react";
import Select from 'react-select'
import Button from "../../Components/ui/Button";
import Upload from "../../Components/Upload";
import {useNavigate} from "react-router";
import {useEffect, useRef, useState} from "react";
import {createProject, getProjects} from "../../lib/puter.action";
import {toast} from "react-toastify";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import {aiRenderOptions, DEFAULT_AI_MODEL} from "../../lib/constants";
import { createPlayer } from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';
import '@videojs/react/video/skin.css';
import {MyPlayer} from "../../Components/ui/VideoPlayer";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "New React Router App" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export default function Home() {
    const navigate = useNavigate();
    const [projects , setProjects] = useState<DesignItem[]>([]);
    const [aiModel, setAiModel] = useState(DEFAULT_AI_MODEL)
    const isCreatingProjectRef = useRef(false);

    //slider animation values
    const [sliderPos, setSliderPos] = useState(50);
    const animFrameRef = useRef<number>(50);
    const startTimeRef = useRef<number>(50);
    const Player = createPlayer({ features: videoFeatures });

    const handleUploadComplete = async (base64Image: string) => {
        try {
            if(!aiModel) {
                toast.warning("Please reload page and select an AI model");
                return;
            }
            if(isCreatingProjectRef.current) return;
            isCreatingProjectRef.current = true;
            const newId = Date.now().toString();
            const name = `Residence ${newId}`;

            const newItem = {
                id: newId,
                name,
                sourceImage :  base64Image,
                renderedImage: undefined,
                timestamp: Date.now(),
            }

            const saved = await createProject({item : newItem, visibility: "private"});

            if(!saved){
                toast.error("Failed to create project");
                return false;
            }

            setProjects((prev) => [saved, ...prev]);

            // Store the image data for the visualizer to retrieve
            sessionStorage.setItem(`floorplan-${newId}`, base64Image);

            navigate(`/visualizer/${newId}`,{
                state: {
                    initialImage: saved.sourceImage,
                    renderedImage: saved.renderedImage || null,
                    name,
                    aiModel
                }
            });

            return true;
        } finally {
            isCreatingProjectRef.current = false;
        }
    }

    useEffect(() => {
        const fetchProjects = async () => {
            const items = await getProjects();

            setProjects(items);
        }
        fetchProjects();
    }, []);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = (timestamp - startTimeRef.current) / 1000;
            // Oscillate between 20 and 80
            const pos = 50 + 8 * Math.sin(elapsed * 1.2);
            setSliderPos(pos);
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    return (
        <div className="home">
            <Navbar />

            <section className="hero">
                <div className="announce">
                    <div className="dot">
                        <div className="pulse"></div>
                    </div>

                    <p>Introducing Raumorph 2.0</p>
                </div>

                <h1>Turn ideas into immersive spaces effortlessly with Raumorph</h1>


                <p className="subtitle">Raumorph is an AI-first design environment that helps you visualize, render
                    and ship architectural projects faster than ever.</p>

                <div className="actions">
                    <a href="#upload" className="cta">
                        Start Building <ArrowRight className="icon" />
                    </a>
                    <a href="#demo">
                        <Button variant="outline" size="lg" className="demo">
                            Watch Demo <ArrowDown className="icon" />
                        </Button>
                    </a>
                </div>

                <div id="demo" className="w-2/3 mx-auto aspect-video">
                    <MyPlayer src="https://stream.mux.com/7xz7wyqSWK02Ak9rwQkmihtu5DuoLd3ax7mX44IWVkFQ.m3u8" />
                </div>

                <br/>



                <div id="upload" className="upload-shell">
                    <div className="grid-overlay"/>
                    <div className="upload-card">
                        <div className="upload-head">
                            <div className="upload-icon">
                                <Layers className="icon" />
                            </div>

                            <h3>Upload your floor plan</h3>
                            <p>Supports JPG and PNG format up to 10MB</p>
                            <Select
                            options={aiRenderOptions}
                            defaultValue={aiRenderOptions.find(option => option.value === DEFAULT_AI_MODEL)}
                            onChange={(e) => {setAiModel(e?.value ?? DEFAULT_AI_MODEL) }}
                            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                            styles={{
                                menuPortal: base => ({ ...base, zIndex: 9999 }),
                                control: base => ({ ...base, background: '#2a2828', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }),
                                menu: base => ({ ...base, background: '#2a2828', border: '1px solid rgba(255,255,255,0.1)' }),
                                option: (base, state) => ({ ...base, background: state.isFocused ? '#a3763a' : '#2a2828', color: 'white', cursor: 'pointer' }),
                                singleValue: base => ({ ...base, color: 'white' }),
                                input: base => ({ ...base, color: 'white' }),
                            }}
                            />
                        </div>

                        <Upload onComplete={handleUploadComplete}/>
                    </div>
                </div>
            </section>

            <section className="projects">
                <div className="section-inner">
                    <div className="section-head">
                        <div className="copy">
                            <h2>Projects</h2>
                            <p>Your latest work and shared community projects all in one place.</p>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {projects.map(({id , name , renderedImage , sourceImage , timestamp}) => (
                            <div key={id} className="project-card group" onClick={() => navigate(`/visualizer/${id}`)}>
                                <div >
                                    <ReactCompareSlider disabled={true} handle={<></>} style={{ width: '100%', height: 'auto' }} position={sliderPos}
                                        itemOne={
                                            <ReactCompareSliderImage src={sourceImage} alt="before" className="compare-img"/>
                                        }
                                        itemTwo={
                                            <ReactCompareSliderImage src={renderedImage || sourceImage || ""} alt="after" className="compare-img"/>
                                        } />
                                </div>

                                <div className="card-body">
                                    <div>
                                        <h3>{name}</h3>

                                        <div className="meta">
                                            <Clock size={12}/>
                                            <span>{new Date(timestamp).toLocaleDateString()}</span>
                                            <span>By you</span>
                                        </div>
                                    </div>

                                    <div className="arrow">
                                        <ArrowUpRight size={18}/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
