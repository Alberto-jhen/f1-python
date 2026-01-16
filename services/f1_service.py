# services/f1_service.py
from . import graphics as grph
import io
from matplotlib import pyplot as plt

def get_violin_plot_image(year, track, session, num_drivers):
    fig, ax = grph.get_lap_time_distributions_violin(year, track, session, num_drivers)
    
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig) 
    return buf

def get_scatter_plot_image(year, track, session, driver):
    fig, ax = grph.get_laps_driver_scatterplot(year, track, session, driver)
    
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return buf