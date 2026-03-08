import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

async def generate_app_icon():
    """Generate CalorieSnap app icon with green apple and measuring tape"""
    
    print("🎨 Generating CalorieSnap app icon...")
    
    # Initialize image generator
    image_gen = OpenAIImageGeneration(api_key=OPENAI_API_KEY)
    
    # Detailed prompt for app icon
    prompt = """App icon design for a food calorie tracking mobile application. 
    Professional, modern, minimalist style. 
    Features a vibrant green apple with a yellow measuring tape wrapped around it. 
    Clean white or light background. 
    The design should be centered, simple, and work well as a small icon. 
    High quality, 1024x1024 resolution, suitable for iOS and Android app stores."""
    
    try:
        # Generate image (using gpt-image-1 which is DALL-E 3)
        print("⏳ Generating image with OpenAI DALL-E 3...")
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            # Save to frontend assets
            icon_path = Path("/app/frontend/assets/images/icon.png")
            adaptive_icon_path = Path("/app/frontend/assets/images/adaptive-icon.png")
            favicon_path = Path("/app/frontend/assets/images/favicon.png")
            
            # Save all three icon files
            with open(icon_path, "wb") as f:
                f.write(images[0])
            print(f"✅ Saved icon.png to {icon_path}")
            
            with open(adaptive_icon_path, "wb") as f:
                f.write(images[0])
            print(f"✅ Saved adaptive-icon.png to {adaptive_icon_path}")
            
            with open(favicon_path, "wb") as f:
                f.write(images[0])
            print(f"✅ Saved favicon.png to {favicon_path}")
            
            # Convert to base64 for verification
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            print(f"\n🎉 Icon generated successfully!")
            print(f"📏 Image size: {len(images[0])} bytes")
            print(f"📝 Base64 length: {len(image_base64)} characters")
            
            return True
        else:
            print("❌ No image was generated")
            return False
            
    except Exception as e:
        print(f"❌ Error generating icon: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(generate_app_icon())
    if success:
        print("\n✨ CalorieSnap icon is ready!")
    else:
        print("\n⚠️ Icon generation failed")
