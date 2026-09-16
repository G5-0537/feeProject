import sys
import collections
import collections.abc
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)       # #0F172A
    CARD_BG = RGBColor(30, 41, 59)       # #1E293B
    TEAL_PRIMARY = RGBColor(15, 143, 131) # #0F8F83
    TEAL_LIGHT = RGBColor(20, 184, 166)  # #14B8A6
    CYAN_ACCENT = RGBColor(56, 189, 248) # #38BDF8
    TEXT_LIGHT = RGBColor(248, 250, 252) # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8
    WHITE = RGBColor(255, 255, 255)

    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, eyebrow_text, title_text, subtitle_text=""):
        # Eyebrow
        tb_eye = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.7), Inches(0.4))
        tf_eye = tb_eye.text_frame
        tf_eye.word_wrap = True
        p_eye = tf_eye.paragraphs[0]
        p_eye.text = eyebrow_text.upper()
        p_eye.font.size = Pt(11)
        p_eye.font.bold = True
        p_eye.font.color.rgb = CYAN_ACCENT

        # Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.8))
        tf_title = tb_title.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE

        # Subtitle
        if subtitle_text:
            tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11.7), Inches(0.4))
            tf_sub = tb_sub.text_frame
            tf_sub.word_wrap = True
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, title, text, icon=""):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = CARD_BG
        shape.line.color.rgb = RGBColor(51, 65, 85)
        shape.line.width = Pt(1)

        tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.15), width - Inches(0.3), height - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        display_title = f"{icon} {title}" if icon else title
        p_title = tf.paragraphs[0]
        p_title.text = display_title
        p_title.font.size = Pt(14)
        p_title.font.bold = True
        p_title.font.color.rgb = WHITE

        p_text = tf.add_paragraph()
        p_text.text = text
        p_text.font.size = Pt(11)
        p_text.font.color.rgb = TEXT_MUTED
        p_text.space_before = Pt(8)

    # ----------------------------------------------------
    # SLIDE 1: Title
    # ----------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, BG_DARK)

    # Tag badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.6), Inches(1.8), Inches(4.1), Inches(0.45))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(15, 143, 131)
    badge.line.fill.background()
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "NEXT-GEN QUEUE ORCHESTRATION"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = WHITE
    p_b.alignment = PP_ALIGN.CENTER

    # Title
    tb_main = s1.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(11.33), Inches(1.5))
    tf_main = tb_main.text_frame
    p_m = tf_main.paragraphs[0]
    p_m.text = "QueLess"
    p_m.font.size = Pt(54)
    p_m.font.bold = True
    p_m.font.color.rgb = WHITE
    p_m.alignment = PP_ALIGN.CENTER

    p_sub = tf_main.add_paragraph()
    p_sub.text = "Eliminating physical waiting lines, empowering businesses, and giving customers their time back."
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = TEXT_MUTED
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.space_before = Pt(14)

    # Meta
    tb_meta = s1.shapes.add_textbox(Inches(1.0), Inches(5.8), Inches(11.33), Inches(0.5))
    tf_meta = tb_meta.text_frame
    p_meta = tf_meta.paragraphs[0]
    p_meta.text = "Full-Stack Project Presentation  •  React 19 + Node.js + MySQL"
    p_meta.font.size = Pt(12)
    p_meta.font.color.rgb = CYAN_ACCENT
    p_meta.alignment = PP_ALIGN.CENTER

    s1.notes_slide.notes_text_frame.text = "Good morning/afternoon everyone. Today we present QueLess, a modern digital solution designed to transform waiting lines from frustrating physical bottlenecks into seamless, remote experiences."

    # ----------------------------------------------------
    # SLIDE 2: The Problem
    # ----------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, BG_DARK)
    add_header(s2, "01. The Problem", "Why Physical Waiting Lines Fail in the Modern Era", "Traditional queuing creates friction, health concerns, and operational blindspots.")

    add_card(s2, Inches(0.8), Inches(2.2), Inches(5.6), Inches(2.1), "Lost Productivity & Anxiety", "Customers spend 30–60+ minutes physically trapped in crowded waiting rooms with zero visibility into when their turn will arrive.", "⏳")
    add_card(s2, Inches(6.8), Inches(2.2), Inches(5.6), Inches(2.1), "Unpredictable Wait Times", "Static paper tokens provide a fixed number without accounting for variable service durations, delays, or emergency walk-ins.", "📉")
    add_card(s2, Inches(0.8), Inches(4.6), Inches(5.6), Inches(2.1), "Congested Lobbies", "Overcrowded waiting rooms increase stress for staff, raise infection risks in healthcare, and create poor customer impressions.", "👥")
    add_card(s2, Inches(6.8), Inches(4.6), Inches(5.6), Inches(2.1), "Zero Operational Intelligence", "Organizations lack real-time visibility into staff counter throughput, queue dropouts, or peak load bottlenecks.", "📊")

    s2.notes_slide.notes_text_frame.text = "Traditional waiting rooms create friction on both sides. Customers feel trapped without knowing when they will be called, while staff are overwhelmed trying to manually orchestrate walk-ins and appointments."

    # ----------------------------------------------------
    # SLIDE 3: The Need
    # ----------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, BG_DARK)
    add_header(s3, "02. The Need", "Why Virtual Queuing is Crucial Today", "Moving from 'Physical Waiting' to 'Virtual Queuing' with transparency and predictability.")

    tb_need = s3.shapes.add_textbox(Inches(0.8), Inches(2.3), Inches(11.7), Inches(4.5))
    tf_need = tb_need.text_frame
    tf_need.word_wrap = True

    needs = [
        ("Time Autonomy for Customers", "Freedom to join a queue remotely from home or cafe, run errands nearby, and arrive right when their token is called."),
        ("Dynamic & Transparent Tracking", "Live updates displaying exact position in line, current counter token, and dynamic wait-time estimation."),
        ("Smooth Staff Desk Management", "Empower service desks to call next tickets, handle walk-in entries, and manage service categories with 1 click."),
        ("Data-Driven Operations", "Actionable historical metrics on average service duration, daily throughput, and counter bottlenecks to optimize staffing.")
    ]

    for i, (title, desc) in enumerate(needs):
        p = tf_need.paragraphs[0] if i == 0 else tf_need.add_paragraph()
        p.text = f"•  {title}: "
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT
        p.space_before = Pt(16) if i > 0 else Pt(0)
        
        # Add description text
        p_desc = p.add_run()
        p_desc.text = desc
        p_desc.font.size = Pt(13)
        p_desc.font.bold = False
        p_desc.font.color.rgb = TEXT_LIGHT

    s3.notes_slide.notes_text_frame.text = "Why do we need a solution like QueLess? Because modern users expect remote access and transparency. When businesses digitize queue tracking, physical congestion disappears, and customer satisfaction surges."

    # ----------------------------------------------------
    # SLIDE 4: The Solution
    # ----------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, BG_DARK)
    add_header(s4, "03. The Solution", "Introducing QueLess: Unified Queue Platform", "Connecting customers and service counters through a synchronized digital experience.")

    add_card(s4, Inches(0.8), Inches(2.3), Inches(3.6), Inches(4.3), "Business Directory", "Explore and filter verified clinics, banks, salons, and offices by type, location, and live queue status.", "🔍")
    add_card(s4, Inches(4.8), Inches(2.3), Inches(3.6), Inches(4.3), "Dual Booking Mode", "Choose between booking scheduled calendar appointments or joining the immediate live virtual queue remotely.", "🎟️")
    add_card(s4, Inches(8.8), Inches(2.3), Inches(3.6), Inches(4.3), "Staff Desk Console", "Full control center for service desks to call next tickets, complete visits, register walk-ins, and inspect analytics.", "🖥️")

    s4.notes_slide.notes_text_frame.text = "QueLess solves the queue crisis by connecting customers and service staff through a unified, synchronized platform. It delivers real-time token tracking for users and complete desk control for businesses."

    # ----------------------------------------------------
    # SLIDE 5: How It Works
    # ----------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, BG_DARK)
    add_header(s5, "04. System Flow", "Seamless 4-Step Operational Journey", "A friction-free cycle from remote token generation to verified counter service.")

    add_card(s5, Inches(0.8), Inches(2.3), Inches(2.7), Inches(4.3), "01. Discover & Join", "Customer selects business service and joins live queue or books a slot remotely.", "📱")
    add_card(s5, Inches(3.8), Inches(2.3), Inches(2.7), Inches(4.3), "02. Live Tracking", "Status updates dynamically: Waiting -> Approaching (Next in line) -> Now Serving.", "⏳")
    add_card(s5, Inches(6.8), Inches(2.3), Inches(2.7), Inches(4.3), "03. Audio & TV Alert", "Staff calls next token. Lobby TV display pulses, chime sounds, and voice announces turn.", "🔊")
    add_card(s5, Inches(9.8), Inches(2.3), Inches(2.7), Inches(4.3), "04. QR Verify & Finish", "Staff scans digital QR pass, completes service, and visit logs to audit history automatically.", "✅")

    s5.notes_slide.notes_text_frame.text = "The workflow is designed for maximum simplicity. Customers can track their queue on mobile while walking nearby, while lobby displays and audio cues ensure no one misses their turn."

    # ----------------------------------------------------
    # SLIDE 6: Key Innovations
    # ----------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, BG_DARK)
    add_header(s6, "05. Key Innovations", "Cutting-Edge Built-in Features", "Hardware-free, browser-native capabilities for enterprise-grade performance.")

    add_card(s6, Inches(0.8), Inches(2.2), Inches(5.6), Inches(2.1), "Public Waiting Room TV Screen", "Dedicated fullscreen lobby display (/display/:id) with high-contrast cards, active counter badges, and live queue ticker.", "📺")
    add_card(s6, Inches(6.8), Inches(2.2), Inches(5.6), Inches(2.1), "Voice Engine & Audio Chimes", "Zero external dependencies. Native Web Audio chimes and Web Speech API announcements ('Token 40, Counter 1').", "🔊")
    add_card(s6, Inches(0.8), Inches(4.6), Inches(5.6), Inches(2.1), "Digital QR Code Token Passes", "Zero-dependency canvas QR code generator displayed on tracking screens for fast counter check-in.", "📱")
    add_card(s6, Inches(6.8), Inches(4.6), Inches(5.6), Inches(2.1), "Resilient Dual Data Engine", "Full MySQL backend with automatic zero-config fallback to in-browser reactive database on GitHub Pages / offline.", "🔄")

    s6.notes_slide.notes_text_frame.text = "Beyond standard ticketing, QueLess provides high-impact features like lobby TV mode, synthetic voice announcements, and QR verification passes without requiring expensive third-party hardware."

    # ----------------------------------------------------
    # SLIDE 7: Technical Architecture
    # ----------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, BG_DARK)
    add_header(s7, "06. Architecture", "Modern & Scalable Technology Stack", "Engineered for rapid responsiveness, zero bloat, and cross-platform flexibility.")

    add_card(s7, Inches(0.8), Inches(2.3), Inches(3.6), Inches(4.3), "Frontend Tier", "• React 19 & Vite 7\n• Lucide React Icons\n• React Router v7\n• Glassmorphic CSS Theme\n• React Error Boundaries\n• PWA Manifest Support", "⚛️")
    add_card(s7, Inches(4.8), Inches(2.3), Inches(3.6), Inches(4.3), "Backend API", "• Node.js & Express\n• JWT Token Authentication\n• Role-based Access Control\n• Dynamic Wait-Time Service\n• Structured Error Handlers\n• RESTful Endpoints", "🚀")
    add_card(s7, Inches(8.8), Inches(2.3), Inches(3.6), Inches(4.3), "Data & Audio Engine", "• MySQL Relational DB\n• InnoDB with Row Locking\n• In-Browser Mock DB Fallback\n• Web Audio API Synthesizer\n• Web Speech Voice Engine\n• HTML5 Canvas QR Generator", "🗄️")

    s7.notes_slide.notes_text_frame.text = "The system is engineered for zero bloat. By leveraging native browser APIs for voice, sound, and QR generation, the application loads in milliseconds and runs reliably on any device."

    # ----------------------------------------------------
    # SLIDE 8: Target Use Cases
    # ----------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, BG_DARK)
    add_header(s8, "07. Applications", "Versatile Industry Deployments", "Configurable for diverse high-traffic service environments.")

    add_card(s8, Inches(0.8), Inches(2.2), Inches(5.6), Inches(2.1), "Healthcare & Clinics", "Eliminate crowded waiting rooms to reduce infection risk; triage walk-ins vs specialist appointments.", "🏥")
    add_card(s8, Inches(6.8), Inches(2.2), Inches(5.6), Inches(2.1), "Banking & Financial Desks", "Segment customer traffic across Cashiers, Loan Desks, and Account Services with counter routing.", "🏦")
    add_card(s8, Inches(0.8), Inches(4.6), Inches(5.6), Inches(2.1), "Salons, Spas & Wellness", "Allow clients to wait comfortably in nearby cafes; provide accurate average styling durations.", "💇")
    add_card(s8, Inches(6.8), Inches(4.6), Inches(5.6), Inches(2.1), "Government & Public Offices", "Eliminate physical queues with high-volume lobby TV displays and loud synthetic voice announcements.", "🏛️")

    s8.notes_slide.notes_text_frame.text = "Any business with a waiting room benefits from QueLess. From OPD clinics to busy bank branches and government offices, the flexibility of multi-service queuing fits every industry."

    # ----------------------------------------------------
    # SLIDE 9: Benefits & ROI
    # ----------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, BG_DARK)
    add_header(s9, "08. Impact & ROI", "Measurable Business & Customer Value", "Clear advantages delivered to both customers and service providers.")

    add_card(s9, Inches(0.8), Inches(2.3), Inches(5.6), Inches(4.3), "For Customers", "⏱️  60%+ reduction in perceived wait time\n\n🚶  Freedom to wait anywhere (cafe, car, home)\n\n🔔  Proactive status alerts ('2 people ahead')\n\n📱  Zero app install needed (runs on any browser)\n\n🎫  Instant digital QR verification token pass", "👤")
    add_card(s9, Inches(6.8), Inches(2.3), Inches(5.6), Inches(4.3), "For Businesses", "📈  35%+ increase in daily counter throughput\n\n📉  Zero waiting room congestion & less stress\n\n📊  Actionable historical logs & CSV export\n\n💰  Zero specialized hardware (uses standard TVs)\n\n⚙️  Fast 1-click counter calling & walk-in entry", "🏢")

    s9.notes_slide.notes_text_frame.text = "The return on investment is immediate: customers enjoy a calm, dignified waiting experience, while businesses unlock higher counter efficiency and operational visibility."

    # ----------------------------------------------------
    # SLIDE 10: Roadmap & Conclusion
    # ----------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, BG_DARK)
    add_header(s10, "09. Future & Conclusion", "Roadmap & Final Takeaway", "Scaling intelligent digital queue management for the future.")

    add_card(s10, Inches(0.8), Inches(2.3), Inches(5.6), Inches(4.3), "Future Roadmap Milestones", "🚀  WhatsApp & SMS token notifications via Twilio\n\n🤖  AI-driven Machine Learning wait time prediction\n\n🏢  Multi-branch enterprise manager dashboard\n\n🌐  Self-service physical kiosk check-in mode", "🌟")
    add_card(s10, Inches(6.8), Inches(2.3), Inches(5.6), Inches(4.3), "Summary & Conclusion", "QueLess bridges the gap between physical operations and digital convenience.\n\nBy replacing stressful lines with calm virtual queues, it sets a new standard for modern service excellence.\n\nThank You! Ready for Questions & Live Demo.", "💡")

    s10.notes_slide.notes_text_frame.text = "QueLess is ready for deployment today and architected to scale tomorrow. Thank you for your time, and we would now love to walk you through a live demonstration and answer any questions."

    # Save
    output_path = "QueLess_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation successfully saved to {output_path}")

if __name__ == "__main__":
    create_presentation()
